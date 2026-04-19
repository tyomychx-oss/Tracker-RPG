"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, ChevronDown, ChevronUp, Trash2, Plus, X, Zap, Pin, PinOff, GripVertical, Flame, Check, RotateCcw } from "lucide-react"
import { useXP, useAreaColors, useAreaFilter, useRecentActivity, useUIColor, useAreaXP, useQuests, useSparks, useAreas } from "@/components/providers"
import { createClient } from "@/utils/supabase/client"
import { syncQuestCompletion, updateQuests, updateProfile, deleteQuestTable, updateQuestsTable } from "@/lib/supabase-actions"
import { addXPToState, removeXPFromState } from "@/lib/rpg-logic"
import { toast } from "sonner"

export function ActiveQuests() {
    const { quests, taskSnapshots, setQuests, setTaskSnapshots, lastUpdated, setLastUpdated } = useQuests()
    const { totalXP, currentLevel, maxXP, setXPState } = useXP()
    const { areaXPs, setAreaXPs } = useAreaXP()
    const { areaColors } = useAreaColors()
    const { selectedAreas } = useAreaFilter()
    const { activities, setActivities } = useRecentActivity()
    const { uiColor } = useUIColor()
    const { sparks, setSparks } = useSparks()
    const { areas: availableAreas } = useAreas()

    const [showArchived, setShowArchived] = useState({
        plans: false,
        dailies: false,
        habits: false,
    })

    const [editingQuest, setEditingQuest] = useState<{
        id: number | string
        category: "plans" | "dailies" | "habits"
        title: string
        skill: string
        xp: number
        rating: string
        frequency?: number
        frequencyCount?: number
        frequency_count?: number
        frequencyPeriodDays?: number
        frequency_period_days?: number
        resetTime?: string
        reset_time?: string
        streak?: number
        subtasks?: { id: string; title: string; completed: boolean }[]
    } | null>(null)

    const [draggedQuest, setDraggedQuest] = useState<{ id: number | string; category: "plans" | "dailies" | "habits" } | null>(null)

    const handleUndoHabitProgress = async (category: "plans" | "dailies" | "habits", questId: number | string, xpAmount: number, skillName: string) => {
        const questObj = quests[category].find((q: any) => q.id === questId) as any;
        if (!questObj) return;

        if (questObj.completed) {
            handleToggleQuest(category, questId, xpAmount, true, questObj.title, skillName);
            return;
        }

        let newQuests = JSON.parse(JSON.stringify(quests));
        const qIdx = newQuests[category].findIndex((q: any) => q.id === questId);
        if (qIdx !== -1 && newQuests[category][qIdx].currentWeeklyProgress > 0) {
            newQuests[category][qIdx].currentWeeklyProgress -= 1;
        } else {
            return;
        }

        const reward = (questObj as any)?.reward || (questObj?.rating === "fast" ? 5 : questObj?.rating === "short" ? 10 : questObj?.rating === "deep" ? 25 : questObj?.rating === "hard" ? 50 : 0)

        const newXpState = removeXPFromState(totalXP, currentLevel, xpAmount)
        const newSkillXPs = { ...areaXPs }
        if (skillName && skillName !== "none") {
            newSkillXPs[skillName] = Math.max(0, (newSkillXPs[skillName] || 0) - xpAmount)
        }
        const newSparks = Math.max(0, (sparks || 0) - reward)
        const newActivities = [{ id: Date.now(), action: `Undo Progress: ${questObj.title}`, timestamp: Date.now(), xp: -xpAmount, type: category, sparks: -reward }, ...activities]

        await syncQuestCompletion({
            category,
            questId,
            isCompleted: false,
            xpChange: -xpAmount,
            sparkChange: -reward,
            skillName,
            newQuestData: newQuests,
            newActivities: newActivities.slice(0, 100),
            newSnapshots: taskSnapshots,
            xpState: newXpState
        })

        // UPDATE STATE
        setQuests(newQuests)
        setXPState(newXpState)
        setAreaXPs(newSkillXPs)
        setActivities(newActivities as any)
        if (typeof setSparks === 'function') setSparks(newSparks)
        setLastUpdated(Date.now())
    };

    // 1. QUEST COMPLETION / TOGGLE
    const handleToggleQuest = async (
        category: "plans" | "dailies" | "habits",
        questId: number | string,
        xpAmount: number,
        isCompleted: boolean,
        questTitle: string,
        skillName: string,
    ) => {
        const today = new Date().toDateString()
        const questObj = quests[category].find((q: any) => q.id === questId) as any
        if (!questObj) return

        const isHabit = category === "habits" || questObj.taskType === "habit" || questObj.taskType === "habits" || (questObj.weeklyTarget && questObj.weeklyTarget > 0);

        let newQuests = JSON.parse(JSON.stringify(quests))
        let newXpState = { totalXP, currentLevel, maxXP }
        let sparkChange = 0
        let newActivities = [...activities]
        let newSnapshots = { ...taskSnapshots }

        const reward = (questObj as any)?.reward || (questObj?.rating === "fast" ? 5 : questObj?.rating === "short" ? 10 : questObj?.rating === "deep" ? 25 : questObj?.rating === "hard" ? 50 : 0)

        let targetXpAmount = xpAmount
        let targetSparkChange = reward

        if (isHabit) {
            targetXpAmount = xpAmount
            targetSparkChange = reward
        }

        if (isCompleted) {
            // UNCOMPLETE
            const snapshot = taskSnapshots[questId]
            if (snapshot) {
                newXpState = {
                    totalLevel: snapshot.previousLevel, // We'll map these correctly in rpb-logic if needed, but for now just use directly
                    totalXP: snapshot.previousXP,
                    currentLevel: snapshot.previousLevel,
                    maxXP: snapshot.previousMaxXP
                } as any
                delete newSnapshots[questId]
            } else {
                newXpState = removeXPFromState(totalXP, currentLevel, targetXpAmount)
            }
            sparkChange = -targetSparkChange
            newActivities = [{ id: Date.now(), action: `Uncompleted: ${questTitle}`, timestamp: Date.now(), xp: -targetXpAmount, type: category }, ...newActivities]

            const qIdx = newQuests[category].findIndex((q: any) => q.id === questId)
            if (qIdx !== -1) {
                if (category === "dailies") {
                    newQuests[category][qIdx].is_completed = false
                    newQuests[category][qIdx].completed_count = Math.max(0, (newQuests[category][qIdx].completed_count || 0) - 1)
                    // If we uncomplete, we usually don't clear last_completed_at 
                    // unless we want to reset the cycle, but let's clear it 
                    // if it was the ONLY completion. Actually, let's just 
                    // keep it as is, or clear it if completed_count is 0.
                    if (newQuests[category][qIdx].completed_count === 0) {
                        newQuests[category][qIdx].last_completed_at = null
                    }
                } else {
                    newQuests[category][qIdx].completed = false
                    newQuests[category][qIdx].lastCompletedDate = null
                    if (isHabit) {
                        const wTarget = newQuests[category][qIdx].weeklyTarget || 7;
                        newQuests[category][qIdx].streak = Math.max(0, (newQuests[category][qIdx].streak || 0) - 1)
                        newQuests[category][qIdx].currentWeeklyProgress = Math.max(0, wTarget - 1)
                    }
                }
            }
        } else {
            // COMPLETE
            const qIdx = newQuests[category].findIndex((q: any) => q.id === questId)
            let isIntermediate = false
            let wTarget = 1
            let cProgress = 1
            
            if (qIdx !== -1) {
                if (isHabit) {
                    wTarget = newQuests[category][qIdx].weeklyTarget || 7
                    cProgress = (newQuests[category][qIdx].currentWeeklyProgress || 0) + 1
                    newQuests[category][qIdx].currentWeeklyProgress = cProgress

                    if (cProgress >= wTarget) {
                        newQuests[category][qIdx].streak = (newQuests[category][qIdx].streak || 0) + 1
                        newQuests[category][qIdx].completed = true
                        newQuests[category][qIdx].lastCompletedDate = today
                    } else {
                        isIntermediate = true
                    }
                } else if (category === "dailies") {
                    const freq = questObj?.frequency_count ?? questObj?.frequencyCount ?? 1
                    const count = (questObj?.completed_count || 0) + 1
                    const isTotalCompleted = count >= freq
                    
                    newQuests[category][qIdx].is_completed = isTotalCompleted
                    newQuests[category][qIdx].completed_count = count
                    if (isTotalCompleted) {
                        newQuests[category][qIdx].last_completed_at = new Date().toISOString()
                    }
                } else {
                    newQuests[category][qIdx].completed = true
                    newQuests[category][qIdx].lastCompletedDate = today
                }
            }

            if (!isIntermediate || isHabit) {
                newSnapshots[questId] = {
                    questId,
                    previousLevel: currentLevel,
                    previousXP: totalXP,
                    previousMaxXP: maxXP,
                    previousSkillXP: areaXPs[skillName] || 0,
                }
                newXpState = addXPToState(totalXP, currentLevel, targetXpAmount)
                sparkChange = targetSparkChange
                newActivities = [{ id: Date.now(), action: `Completed: ${questTitle}`, timestamp: Date.now(), xp: targetXpAmount, type: category, sparks: targetSparkChange }, ...newActivities]
            }
            if (isIntermediate && isHabit) {
                toast.success(`Progress saved! ${cProgress}/${wTarget} to Weekly Prize 🔥`)
            }
        }

        const newSkillXPs = { ...areaXPs }
        if (skillName && skillName !== "none") {
            newSkillXPs[skillName] = Math.max(0, (newSkillXPs[skillName] || 0) + (isCompleted ? -xpAmount : xpAmount))
        }
        const newSparks = Math.max(0, (sparks || 0) + sparkChange)

        await syncQuestCompletion({
            category,
            questId,
            isCompleted: !isCompleted,
            xpChange: isCompleted ? -targetXpAmount : targetXpAmount,
            sparkChange,
            skillName,
            newQuestData: newQuests,
            newActivities: newActivities.slice(0, 100),
            newSnapshots,
            xpState: newXpState
        })

        // 1. OPTIMISTIC UPDATE
        setQuests(newQuests)
        setXPState(newXpState)
        setAreaXPs(newSkillXPs)
        setActivities(newActivities as any)
        setTaskSnapshots(newSnapshots)
        setLastUpdated(Date.now())
        if (typeof setSparks === 'function') setSparks(newSparks)
    }

    const handleArchiveQuest = async (category: "plans" | "dailies" | "habits", questId: number | string, questTitle: string) => {
        const newQuests = JSON.parse(JSON.stringify(quests))
        const qIdx = newQuests[category].findIndex((q: any) => q.id === questId)
        if (qIdx !== -1) {
            newQuests[category][qIdx].archivedAt = Date.now()
        }

        const newActivities = [
            { id: Date.now(), action: `Archived: ${questTitle}`, timestamp: Date.now() },
            ...activities
        ]

        try {
            if (category === "dailies") {
                newQuests[category][qIdx].is_archived = true
                await updateQuestsTable([newQuests[category][qIdx]])
                await updateProfile({ activities: newActivities.slice(0, 100) })
            } else {
                const { data, error } = await updateProfile({
                    quests: newQuests,
                    activities: newActivities.slice(0, 100)
                })
                if (error) throw error
            }

            setQuests(newQuests)
            setActivities(newActivities as any)
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        }
    }

    const handleUnarchiveQuest = async (category: "plans" | "dailies" | "habits", questId: number | string, xpAmount: number, skillName: string) => {
        const newQuests = JSON.parse(JSON.stringify(quests))
        const qIdx = newQuests[category].findIndex((q: any) => q.id === questId)
        
        let shouldDeductXP = true;
        
        if (qIdx !== -1) {
            const questObj = newQuests[category][qIdx];
            questObj.archivedAt = null;
            
            const isHabit = category === "habits" || questObj.taskType === "habit" || questObj.taskType === "habits" || (questObj.weeklyTarget && questObj.weeklyTarget > 0);
            
            if (isHabit) {
                // Keep the completion state, weekly target progress, and prevent XP rollback for habits
                shouldDeductXP = false;
            } else if (category === "dailies") {
                questObj.is_archived = false;
                shouldDeductXP = false; // Dailies don't deduct XP on unarchive as they are repeatable
            } else {
                questObj.completed = false;
            }
        }

        let newXp = { totalXP, currentLevel, maxXP };
        let newSkillXPs = { ...areaXPs };
        
        if (shouldDeductXP) {
            newXp = removeXPFromState(totalXP, currentLevel, xpAmount);
            if (skillName && skillName !== "none") {
                newSkillXPs[skillName] = Math.max(0, (newSkillXPs[skillName] || 0) - xpAmount);
            }
        }

        try {
            if (category === "dailies") {
                await updateQuestsTable([newQuests[category][qIdx]])
                await updateProfile({
                    totalXP: newXp.totalXP,
                    currentLevel: newXp.currentLevel,
                    maxXP: newXp.maxXP,
                    skillXPs: newSkillXPs
                })
            } else {
                const { data, error } = await updateProfile({
                    quests: newQuests,
                    totalXP: newXp.totalXP,
                    currentLevel: newXp.currentLevel,
                    maxXP: newXp.maxXP,
                    skillXPs: newSkillXPs
                })
                if (error) throw error
            }

            setQuests(newQuests)
            if (shouldDeductXP) {
                setXPState(newXp)
                setAreaXPs(newSkillXPs)
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : "Error unarchiving quest")
        }
    }

    const handleDeleteQuest = async (category: "plans" | "dailies" | "habits", questId: number | string, questTitle: string) => {
        const newQuests = JSON.parse(JSON.stringify(quests))
        newQuests[category] = newQuests[category].filter((q: any) => q.id !== questId)

        const newActivities = [
            { id: Date.now(), action: `Deleted: ${questTitle}`, timestamp: Date.now() },
            ...activities
        ]

        try {
            if (category === "dailies") {
                await deleteQuestTable(questId)
                await updateProfile({ activities: newActivities.slice(0, 100) })
            } else {
                const { error } = await updateProfile({
                    quests: newQuests,
                    activities: newActivities.slice(0, 100)
                })
                if (error) throw error
            }

            setQuests(newQuests)
            setActivities(newActivities as any)
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        }
    }

    const handleSaveQuest = async () => {
        if (!editingQuest) return

        const newQuests = JSON.parse(JSON.stringify(quests))
        const qIdx = newQuests[editingQuest.category].findIndex((q: any) => q.id === editingQuest.id)

        if (qIdx !== -1) {
            newQuests[editingQuest.category][qIdx] = {
                ...newQuests[editingQuest.category][qIdx],
                title: editingQuest.title,
                skill: editingQuest.skill,
                xp: editingQuest.xp,
                rating: editingQuest.rating,
                // Handle both Legacy and SQL fields
                frequencyCount: editingQuest.frequencyCount,
                frequency_count: editingQuest.frequency_count || editingQuest.frequencyCount,
                frequencyPeriodDays: editingQuest.frequencyPeriodDays,
                frequency_period_days: editingQuest.frequency_period_days || editingQuest.frequencyPeriodDays,
                resetTime: editingQuest.resetTime,
                reset_time: editingQuest.reset_time || editingQuest.resetTime,
                subtasks: editingQuest.subtasks ? editingQuest.subtasks.filter(s => s.title.trim() !== "") : [],
            }
        }

        try {
            if (editingQuest.category === "dailies") {
                await updateQuestsTable([newQuests[editingQuest.category][qIdx]])
            } else {
                await updateQuests(newQuests)
            }
            setQuests(newQuests)
            setEditingQuest(null)
        } catch (error) {
            toast.error("Failed to save quest changes")
        }
    }

    const handleToggleSubtask = async (category: "plans" | "dailies" | "habits", questId: number | string, subtaskId: string) => {
        const newQuests = JSON.parse(JSON.stringify(quests))
        const qIdx = newQuests[category].findIndex((q: any) => q.id === questId)
        if (qIdx !== -1) {
            newQuests[category][qIdx].subtasks = newQuests[category][qIdx].subtasks.map((s: any) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
            )
        }
        const { error } = await updateQuests(newQuests)
        if (!error) setQuests(newQuests)
        else toast.error("Failed to toggle subtask")
    }

    const handlePinQuest = async (category: "plans" | "dailies" | "habits", questId: number | string, isPinned: boolean) => {
        const newQuests = JSON.parse(JSON.stringify(quests))
        const qIdx = newQuests[category].findIndex((q: any) => q.id === questId)
        if (qIdx !== -1) {
            newQuests[category][qIdx].pinned = !isPinned
            newQuests[category][qIdx].pinnedOrder = isPinned ? undefined : Date.now()
        }
        const { error } = await updateQuests(newQuests)
        if (!error) setQuests(newQuests)
        else toast.error("Failed to pin quest")
    }

    const handleEditQuest = (quest: any, category: "plans" | "dailies" | "habits") => {
        setEditingQuest({
            id: quest.id,
            category,
            title: quest.title,
            skill: quest.skill,
            xp: quest.xp,
            rating: quest.rating,
            frequency: quest.frequency,
            frequencyCount: quest.frequencyCount,
            frequencyPeriodDays: quest.frequencyPeriodDays,
            resetTime: quest.resetTime,
            subtasks: quest.subtasks || [],
        })
    }

    // Drag and drop sorting
    const handleDrop = async (targetQuestId: number | string, category: "plans" | "dailies" | "habits") => {
        if (!draggedQuest || draggedQuest.category !== category) return
        if (draggedQuest.id === targetQuestId) return

        const pinnedQuests = quests[category]
            .filter((q: any) => q.pinned && q.archivedAt === null)
            .sort((a: any, b: any) => (a.pinnedOrder ?? Infinity) - (b.pinnedOrder ?? Infinity))

        const draggedIndex = pinnedQuests.findIndex((q: any) => q.id === draggedQuest.id)
        const targetIndex = pinnedQuests.findIndex((q: any) => q.id === targetQuestId)

        if (draggedIndex === -1 || targetIndex === -1) return

        const reordered = [...pinnedQuests]
        const [removed] = reordered.splice(draggedIndex, 1)
        reordered.splice(targetIndex, 0, removed)

        const newQuests = JSON.parse(JSON.stringify(quests))
        reordered.forEach((quest: any, index: number) => {
            const qIdx = newQuests[category].findIndex((q: any) => q.id === quest.id)
            if (qIdx !== -1) newQuests[category][qIdx].pinnedOrder = index
        })

        const { error } = await updateQuests(newQuests)
        if (!error) setQuests(newQuests)
        else toast.error("Failed to reorder quests")
        setDraggedQuest(null)
    }

    // Helper functions for rendering
    const priorityOrder: Record<string, number> = { fast: 0, short: 1, deep: 2, hard: 3 }

    const getActiveQuests = (category: "plans" | "dailies" | "habits") =>
        quests[category]
            .filter((q: any) => {
                const isActive = (category === 'dailies') ? (q.is_archived !== true) : (q.archivedAt === null)
                if (!selectedAreas || selectedAreas.length === 0) return isActive
                return isActive && selectedAreas.includes(q.skill)
            })
            .sort((a: any, b: any) => {
                if (a.pinned && !b.pinned) return -1
                if (!a.pinned && b.pinned) return 1
                if (a.pinned && b.pinned) {
                    const orderA = a.pinnedOrder ?? Infinity
                    const orderB = b.pinnedOrder ?? Infinity
                    return orderA - orderB
                }
                const pa = priorityOrder[a.rating] ?? 99
                const pb = priorityOrder[b.rating] ?? 99
                return pa - pb
            })

    const getArchivedQuests = (category: "plans" | "dailies" | "habits") =>
        quests[category]
            .filter((q: any) => {
                const isArchived = (category === 'dailies') ? (q.is_archived === true) : (q.archivedAt !== null)
                if (selectedAreas?.length && !selectedAreas.includes(q.skill)) return false
                if (!selectedAreas || selectedAreas.length === 0) return isArchived
                return isArchived && selectedAreas.includes(q.skill)
            })
            .sort((a: any, b: any) => (b.archivedAt || 0) - (a.archivedAt || 0))

    const renderQuestCard = (quest: any, category: "plans" | "dailies" | "habits", isArchived = false) => {
        const skillColor = areaColors[quest.skill] || uiColor
        const priorityColor =
            quest.rating === "fast" ? "#84cc16"
                : quest.rating === "short" ? "#22d3ee"
                    : quest.rating === "deep" ? "#f59e0b"
                        : quest.rating === "hard" ? "#ef4444"
                            : "#d1d5db"

        const isPinned = quest.pinned && !isArchived
        const hasCategory = !!(quest.skill && quest.skill !== "none")
        
        // Handle both Legacy (Plans/Habits) and SQL (Dailies)
        const isCompleted = category === 'dailies' ? (quest.is_completed === true) : (quest.completed === true)
        const isCurrentArchived = category === 'dailies' ? (quest.is_archived === true) : (quest.archivedAt !== null)

        const isHabit = category === "habits" || quest.taskType === "habit" || quest.taskType === "habits" || (quest.weeklyTarget && quest.weeklyTarget > 0);
        const wTarget = isHabit ? (quest.weeklyTarget || 7) : 1;
        const cProgress = isHabit ? (quest.currentWeeklyProgress || 0) : 0;

        return (
            <div
                key={quest.id}
                className={`overflow-hidden ${isCurrentArchived ? "opacity-50" : isCompleted ? "opacity-70" : ""} ${isPinned ? "cursor-grab active:cursor-grabbing" : ""} ${draggedQuest?.id === quest.id ? "opacity-50" : ""}`}
                draggable={isPinned}
                onDragStart={isPinned ? () => setDraggedQuest({ id: quest.id, category }) : undefined}
                onDragEnd={() => setDraggedQuest(null)}
                onDragOver={isPinned ? (e) => e.preventDefault() : undefined}
                onDrop={isPinned ? () => handleDrop(quest.id, category) : undefined}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${priorityColor}15, transparent)`
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                }}
                style={{
                    padding: "0",
                    borderRadius: "12px",
                    background: "transparent",
                    transition: "all 0.3s ease",
                }}
            >
                <div
                    style={{
                        borderRadius: "12px",
                        background: "transparent",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "12px 16px",
                        position: "relative",
                    }}
                >
                    <div style={{
                        position: "absolute",
                        left: 0,
                        top: "8px",
                        bottom: "8px",
                        width: "3px",
                        borderRadius: "0 3px 3px 0",
                        background: priorityColor,
                        opacity: 0.7
                    }} />

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ position: "relative", flexShrink: 0, marginTop: hasCategory ? "12px" : "0px" }}>
                            {!isArchived && (
                                <button
                                    className="h-4 w-4 p-0 bg-transparent border-none outline-none cursor-pointer group/pin"
                                    style={{ position: "absolute", top: "-18px", left: "-13px" }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handlePinQuest(category, quest.id, !!quest.pinned)
                                    }}
                                >
                                    <Pin
                                        className="h-3 w-3 rotate-45 transition-all duration-200 group-hover/pin:scale-110"
                                        style={isPinned
                                            ? { color: uiColor, filter: `drop-shadow(0 0 4px ${uiColor})` }
                                            : { color: 'var(--muted-foreground)', opacity: 0.15 }
                                        }
                                    />
                                </button>
                            )}

                            {isHabit ? (
                                <div className="flex items-center gap-1.5">
                                    {cProgress > 0 && !isArchived && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUndoHabitProgress(category, quest.id, quest.xp, quest.skill);
                                            }}
                                            className="flex items-center justify-center w-5 h-5 rounded-md opacity-40 hover:opacity-100 hover:bg-gray-500/20 transition-all text-muted-foreground"
                                            title="Undo progress"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <div
                                        onClick={() => {
                                            if (!isArchived) {
                                                if (cProgress >= wTarget) return; // Disabled if already completed weekly target
                                                handleToggleQuest(category, quest.id, quest.xp, isCompleted, quest.title, quest.skill)
                                            }
                                        }}
                                        className={`flex items-center justify-center w-5 h-5 rounded-md border ${isCompleted ? "bg-orange-500 border-orange-500" : "border-orange-500/50"} ${(isArchived || cProgress >= wTarget) ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-orange-500/20"}`}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-3 w-3 text-white" />
                                        ) : (
                                            <Plus className="h-3 w-3 text-orange-500" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={() => {
                                        handleToggleQuest(category, quest.id, quest.xp, isCompleted, quest.title, quest.skill)
                                    }}
                                    className="h-5 w-5 border border-gray-300"
                                    disabled={isArchived}
                                />
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            {quest.skill && quest.skill !== "none" && (
                                <div style={{ fontSize: "11px", color: skillColor, fontFamily: "'Crimson Pro', serif", letterSpacing: "0.12em", textTransform: "uppercase", fontStyle: "italic", lineHeight: "1", marginBottom: "2px" }}>— {quest.skill}</div>
                            )}
                            <h4 className="font-medium text-foreground" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{quest.title}</h4>

                            {isHabit && (
                                <div className="flex items-center gap-0.5 mt-1 mb-2">
                                    {[...Array(wTarget)].map((_, i) => (
                                        <Flame key={i} className={`h-3 w-3 ${i < cProgress ? "text-orange-500 fill-orange-500" : "text-muted-foreground opacity-30"}`} />
                                    ))}
                                </div>
                            )}

                            {quest.subtasks && quest.subtasks.length > 0 && (
                                <div className="space-y-1 mt-2">
                                    {quest.subtasks.map((subtask: any) => (
                                        <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                            <div
                                                className={`h-4 w-4 rounded-full border border-muted-foreground cursor-pointer flex items-center justify-center transition-colors ${subtask.completed ? "bg-primary border-primary" : "hover:border-primary"}`}
                                                onClick={(e) => { e.stopPropagation(); handleToggleSubtask(category, quest.id, subtask.id) }}
                                            >
                                                {subtask.completed && <div className="h-2 w-2 rounded-full bg-white" />}
                                            </div>
                                            <span className={`${subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{subtask.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isCompleted && !isArchived && (
                                <div style={{ paddingTop: "8px" }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveQuest(category, quest.id, quest.title) }}
                                        style={{ padding: "8px 28px", borderRadius: "6px", border: `1px solid ${priorityColor}30`, background: "transparent", color: priorityColor, fontSize: "12px", fontWeight: 600, fontFamily: "'Crimson Pro', serif", letterSpacing: "0.1em", textTransform: "uppercase", fontStyle: "italic", width: "100%", cursor: "pointer", transition: "all 0.25s ease" }}
                                    >
                                        Archive Quest
                                    </button>
                                </div>
                            )}

                            {isArchived && (
                                <div style={{ paddingTop: "8px" }}>
                                    <Button size="sm" variant="outline" className="w-full text-xs bg-transparent" onClick={(e) => { e.stopPropagation(); handleUnarchiveQuest(category, quest.id, quest.xp, quest.skill) }}>Unarchive</Button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", flexShrink: 0, marginTop: hasCategory ? "6px" : "0px" }}>
                            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">+{quest.xp} XP</span>
                            <span className="text-xs text-orange-500 font-mono whitespace-nowrap flex items-center gap-0.5">
                                <Zap className="h-3 w-3" />
                                +{(quest as any).reward || (quest.rating === "fast" ? 5 : quest.rating === "short" ? 10 : quest.rating === "deep" ? 25 : quest.rating === "hard" ? 50 : 0)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-50 flex-shrink-0 ml-1" style={{ marginTop: hasCategory ? "12px" : "0px" }}>
                            {!isArchived && (
                                <>
                                    <button className="h-6 w-6 p-0 bg-transparent border-none outline-none cursor-pointer text-gray-500 hover:text-white flex items-center justify-center hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" onClick={(e) => { e.stopPropagation(); handleEditQuest(quest, category) }}><Pencil className="h-3 w-3" /></button>
                                    <button className="h-6 w-6 p-0 bg-transparent border-none outline-none cursor-pointer text-gray-500 hover:text-white flex items-center justify-center hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" onClick={(e) => { e.stopPropagation(); handleDeleteQuest(category, quest.id, quest.title) }}><Trash2 className="h-3 w-3" /></button>
                                </>
                            )}
                            {isHabit && (
                                <span className="text-xs flex items-center gap-1 ml-1 opacity-100">
                                    <span>🔥</span>
                                    {(quest as any).streak || 0}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        )
    }

    const renderTabContent = (category: "plans" | "dailies" | "habits") => {
        const activeQuests = getActiveQuests(category)
        const archivedQuests = getArchivedQuests(category)
        const hasArchived = archivedQuests.length > 0

        return (
            <div className="space-y-3 mt-4">
                {activeQuests.map((quest: any) => renderQuestCard(quest, category))}

                {hasArchived && (
                    <div className="pt-4 border-t border-border">
                        <button
                            onClick={() => setShowArchived((prev) => ({ ...prev, [category]: !prev[category] }))}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-full justify-center transition-colors"
                        >
                            Archive {showArchived[category] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {showArchived[category] && (
                            <div className="space-y-3 mt-3">
                                {archivedQuests.map((quest: any) => renderQuestCard(quest, category, true))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                    <CardTitle className="text-foreground" style={{ color: uiColor }}>
                        ACTIVE QUESTS
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="plans" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-secondary">
                            <TabsTrigger value="plans">Tasks</TabsTrigger>
                            <TabsTrigger value="dailies">Daily</TabsTrigger>
                            <TabsTrigger value="habits">Habits</TabsTrigger>
                        </TabsList>
                        <TabsContent value="plans">{renderTabContent("plans")}</TabsContent>
                        <TabsContent value="dailies">{renderTabContent("dailies")}</TabsContent>
                        <TabsContent value="habits">{renderTabContent("habits")}</TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Dialog open={!!editingQuest} onOpenChange={(open) => !open && setEditingQuest(null)}>
                <DialogContent className="bg-card border-border" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-primary">EDIT QUEST</DialogTitle>
                    </DialogHeader>
                    {editingQuest && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan-name">Quest Name</Label>
                                <Input id="plan-name" value={editingQuest.title} onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })} className="bg-input" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="skill">Area</Label>
                                    <Select value={editingQuest.skill || "none"} onValueChange={(value) => setEditingQuest({ ...editingQuest, skill: value === "none" ? "" : value })}>
                                        <SelectTrigger id="skill" className="bg-input"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No area</SelectItem>
                                            {(availableAreas || []).map((skill: string) => (<SelectItem key={skill} value={skill}>{skill}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Priority</Label>
                                    <Select value={editingQuest.rating} onValueChange={(value) => setEditingQuest({ ...editingQuest, rating: value })}>
                                        <SelectTrigger id="rating" className="bg-input"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fast">Fast</SelectItem>
                                            <SelectItem value="short">Short</SelectItem>
                                            <SelectItem value="deep">Deep</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="xp-amount">Amount of XP</Label>
                                <Input id="xp-amount" type="number" value={editingQuest.xp} onChange={(e) => setEditingQuest({ ...editingQuest, xp: Number(e.target.value) })} className="bg-input" />
                            </div>
                            {editingQuest.category === "dailies" && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="frequency-count">Times</Label>
                                        <Select value={String(editingQuest.frequencyCount ?? 1)} onValueChange={(value) => setEditingQuest({ ...editingQuest, frequencyCount: Number(value) })}>
                                            <SelectTrigger id="frequency-count" className="bg-input"><SelectValue /></SelectTrigger>
                                            <SelectContent>{[...Array(10)].map((_, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="frequency-period">Per days</Label>
                                        <Select value={String(editingQuest.frequencyPeriodDays ?? 1)} onValueChange={(value) => setEditingQuest({ ...editingQuest, frequencyPeriodDays: Number(value) })}>
                                            <SelectTrigger id="frequency-period" className="bg-input"><SelectValue /></SelectTrigger>
                                            <SelectContent>{[...Array(14)].map((_, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reset-time">Reset Time (UTC)</Label>
                                        <Select 
                                            value={(editingQuest.reset_time || editingQuest.resetTime || "00:00")} 
                                            onValueChange={(value) => setEditingQuest({ ...editingQuest, resetTime: value, reset_time: value })}
                                        >
                                            <SelectTrigger id="reset-time" className="bg-input"><SelectValue /></SelectTrigger>
                                            <SelectContent>{[...Array(24)].map((_, h) => { const label = `${String(h).padStart(2, "0")}:00`; return (<SelectItem key={label} value={label}>{label}</SelectItem>) })}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3 pt-2 border-t border-border">
                                <Label>Subtasks</Label>
                                <div className="space-y-2">
                                    {(editingQuest.subtasks || []).map((subtask, index) => (
                                        <div key={subtask.id} className="flex items-center gap-2">
                                            <Input
                                                value={subtask.title}
                                                onChange={(e) => {
                                                    const updated = [...(editingQuest.subtasks || [])]
                                                    updated[index].title = e.target.value
                                                    setEditingQuest({ ...editingQuest, subtasks: updated })
                                                }}
                                                className="bg-input h-8 text-sm"
                                            />
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                const updated = (editingQuest.subtasks || []).filter((_, i) => i !== index)
                                                setEditingQuest({ ...editingQuest, subtasks: updated })
                                            }}><X className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
                                        const updated = [...(editingQuest.subtasks || []), { id: Date.now().toString(), title: "", completed: false }]
                                        setEditingQuest({ ...editingQuest, subtasks: updated })
                                    }}>+ Add Subtask</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingQuest(null)}>Cancel</Button>
                        <Button style={{ backgroundColor: uiColor }} className="text-white" onClick={handleSaveQuest}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
