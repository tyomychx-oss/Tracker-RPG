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
import { Pencil, ChevronDown, ChevronUp, Trash2, Plus, X, Zap, Pin, PinOff, GripVertical } from "lucide-react"
import { useXP, useAreaColors, useAreaFilter, useRecentActivity, useUIColor, useAreaXP, useQuests, useSparks, useAreas } from "@/components/providers"

interface TaskStateSnapshot {
  questId: number
  previousLevel: number
  previousXP: number
  previousMaxXP: number
  previousSkillXP: number
}

export function ActiveQuests() {
  const { quests, updateQuest, deleteQuest } = useQuests()
  const { addXP, removeXP, currentLevel, totalXP, maxXP, restorePreviousState } = useXP()
  const { addAreaXP, removeAreaXP, areaXPs } = useAreaXP()
  const { areaColors } = useAreaColors()
  const { selectedAreas } = useAreaFilter()
  const { addActivity } = useRecentActivity()
  const { uiColor } = useUIColor()
  const { addSparks, removeSparks } = useSparks() // Added
  const { areas: availableAreas } = useAreas()

  const [showArchived, setShowArchived] = useState({
    plans: false,
    dailies: false,
    habits: false,
  })

  const [editingQuest, setEditingQuest] = useState<{
    id: number
    category: "plans" | "dailies" | "habits"
    title: string
    skill: string
    xp: number
    rating: string
    frequency?: number
    frequencyCount?: number
    frequencyPeriodDays?: number
    resetTime?: string
    streak?: number
    subtasks?: { id: string; title: string; completed: boolean }[]
  } | null>(null)


  const [taskSnapshots, setTaskSnapshots] = useState<Record<number, TaskStateSnapshot>>({})
  const [isSnapshotsLoaded, setIsSnapshotsLoaded] = useState(false)

  // Drag and drop state
  const [draggedQuest, setDraggedQuest] = useState<{ id: number; category: "plans" | "dailies" | "habits" } | null>(null)

  // Load snapshots from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile = JSON.parse(storedProfile)
      if (profile.taskSnapshots) {
        setTaskSnapshots(profile.taskSnapshots)
      }
    }
    setIsSnapshotsLoaded(true)
  }, [])

  // Save snapshots to localStorage
  useEffect(() => {
    if (!isSnapshotsLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile = JSON.parse(storedProfile)
      profile.taskSnapshots = taskSnapshots
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [taskSnapshots, isSnapshotsLoaded])

  // Daily Reset Logic
  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date()
      const utcHour = now.getUTCHours().toString().padStart(2, "0")
      const utcMinute = now.getUTCMinutes().toString().padStart(2, "0")
      const currentUTC = `${utcHour}:${utcMinute}`
      const todayString = now.toDateString()
      const todayStartUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

        ; (["dailies", "habits"] as const).forEach((category) => {
          quests[category].forEach((quest: any) => {
            const resetAt = quest.resetTime || "00:00"
            if (quest.lastResetDate !== todayString && currentUTC >= resetAt) {
              if (category === "dailies") {
                const periodDays = quest.frequencyPeriodDays || 1
                const periodStart = typeof quest.periodStartAt === "number" ? quest.periodStartAt : todayStartUTC
                const daysElapsed = Math.floor((todayStartUTC - periodStart) / 86400000)
                const shouldResetCount = daysElapsed >= periodDays

                const updates: any = {
                  completed: false,
                  lastCompletedDate: null,
                  lastResetDate: todayString,
                }

                if (shouldResetCount) {
                  updates.completedCount = 0
                  updates.periodStartAt = todayStartUTC
                }
                updateQuest(category, quest.id, updates)
              } else {
                updateQuest(category, quest.id, {
                  completed: false,
                  lastCompletedDate: null,
                  lastResetDate: todayString,
                } as any)
              }
            }
          })
        })
    }

    checkDailyReset()
    const interval = setInterval(checkDailyReset, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [quests, updateQuest])

  const handleToggleQuest = (
    category: "plans" | "dailies" | "habits",
    questId: number,
    xpAmount: number,
    isCompleted: boolean,
    questTitle: string,
    skillName: string,
  ) => {
    const today = new Date().toDateString()
    const questObj = quests[category].find((q: any) => q.id === questId) as any

    if (isCompleted) {
      // UNCOMPLETE TASK
      const snapshot = taskSnapshots[questId]
      if (snapshot) {
        // Use snapshot to restore exact previous state
        restorePreviousState(snapshot.previousLevel, snapshot.previousXP, snapshot.previousMaxXP)

        // Restore skill XP to previous amount
        const currentSkillXP = areaXPs[skillName] || 0
        const xpToRemove = currentSkillXP - snapshot.previousSkillXP
        if (xpToRemove > 0 && skillName) {
          removeAreaXP(skillName, xpToRemove)
        }

        // Remove Sparks logic
        const reward = (questObj as any)?.reward || (questObj?.rating === "fast" ? 5 : questObj?.rating === "short" ? 10 : questObj?.rating === "deep" ? 25 : questObj?.rating === "hard" ? 50 : 0)
        removeSparks(reward)

        // Remove snapshot
        setTaskSnapshots((prev) => {
          const newSnapshots = { ...prev }
          delete newSnapshots[questId]
          return newSnapshots
        })
      } else {
        // Fallback
        removeXP(xpAmount)
        if (skillName) {
          removeAreaXP(skillName, xpAmount)
        }
      }

      addActivity(`Uncompleted: ${questTitle}`, -xpAmount, category)
      updateQuest(category, questId, { completed: false, lastCompletedDate: null })

    } else {
      // COMPLETE TASK
      const snapshot: TaskStateSnapshot = {
        questId,
        previousLevel: currentLevel,
        previousXP: totalXP,
        previousMaxXP: maxXP,
        previousSkillXP: areaXPs[skillName] || 0,
      }
      setTaskSnapshots((prev) => ({ ...prev, [questId]: snapshot }))

      // Add XP
      addXP(xpAmount)
      if (skillName) {
        addAreaXP(skillName, xpAmount)
      }

      // Add Sparks logic
      const reward = (questObj as any)?.reward || (questObj?.rating === "fast" ? 5 : questObj?.rating === "short" ? 10 : questObj?.rating === "deep" ? 25 : questObj?.rating === "hard" ? 50 : 0)
      addSparks(reward)

      addActivity(`Completed: ${questTitle}`, xpAmount, category, reward) // Fixed duplicate calls here

      if (category === "habits") {
        const currentStreak = (questObj?.streak || 0) + 1
        updateQuest(category, questId, {
          completed: true,
          lastCompletedDate: today,
          streak: currentStreak,
        })
      } else if (category === "dailies") {
        const freq = questObj?.frequencyCount ?? questObj?.frequency ?? 1
        const count = (questObj?.completedCount || 0) + 1
        updateQuest(category, questId, {
          completed: count >= freq,
          lastCompletedDate: today,
          completedCount: count,
        } as any)
      } else {
        updateQuest(category, questId, { completed: true, lastCompletedDate: today })
      }
    }
  }

  const handleArchiveQuest = (category: "plans" | "dailies" | "habits", questId: number, questTitle: string) => {
    updateQuest(category, questId, { archivedAt: Date.now() })
    addActivity(`Archived: ${questTitle}`)
  }

  const handleUnarchiveQuest = (
    category: "plans" | "dailies" | "habits",
    questId: number,
    xpAmount: number,
    skillName: string,
  ) => {
    removeXP(xpAmount)
    if (skillName) {
      removeAreaXP(skillName, xpAmount)
    }
    updateQuest(category, questId, { completed: false, archivedAt: null })
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

  const handleSaveQuest = () => {
    if (!editingQuest) return

    updateQuest(editingQuest.category, editingQuest.id, {
      title: editingQuest.title,
      skill: editingQuest.skill,
      xp: editingQuest.xp,
      rating: editingQuest.rating,
      frequencyCount: editingQuest.frequencyCount,
      frequencyPeriodDays: editingQuest.frequencyPeriodDays,
      resetTime: editingQuest.resetTime,
      subtasks: editingQuest.subtasks ? editingQuest.subtasks.filter(s => s.title.trim() !== "") : [],
    })
    setEditingQuest(null)
  }

  const handleDeleteQuest = (category: "plans" | "dailies" | "habits", questId: number, questTitle: string) => {
    deleteQuest(category, questId)
    addActivity(`Deleted: ${questTitle}`)
  }

  const handleDragStart = (questId: number, category: "plans" | "dailies" | "habits") => {
    setDraggedQuest({ id: questId, category })
  }

  const handleDragEnd = () => {
    setDraggedQuest(null)
  }

  const handleDrop = (targetQuestId: number, category: "plans" | "dailies" | "habits") => {
    if (!draggedQuest || draggedQuest.category !== category) return
    if (draggedQuest.id === targetQuestId) return

    const pinnedQuests = quests[category]
      .filter((q: any) => q.pinned && q.archivedAt === null)
      .sort((a: any, b: any) => (a.pinnedOrder ?? Infinity) - (b.pinnedOrder ?? Infinity))

    const draggedIndex = pinnedQuests.findIndex((q: any) => q.id === draggedQuest.id)
    const targetIndex = pinnedQuests.findIndex((q: any) => q.id === targetQuestId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder pinned quests
    const reordered = [...pinnedQuests]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, removed)

    // Update pinnedOrder for all reordered quests
    reordered.forEach((quest: any, index: number) => {
      updateQuest(category, quest.id, { pinnedOrder: index })
    })

    setDraggedQuest(null)
  }

  const BASIC_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#10b981",
    "#059669", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#a855f7",
  ]

  const renderQuestCard = (quest: any, category: "plans" | "dailies" | "habits", isArchived = false) => {
    const skillColor = areaColors[quest.skill] || uiColor
    const priorityBorder =
      quest.rating === "fast" ? "border-l-lime-500"
        : quest.rating === "short" ? "border-l-cyan-400"
          : quest.rating === "deep" ? "border-l-amber-500"
            : quest.rating === "hard" ? "border-l-red-500"
              : "border-l-gray-300"

    const priorityColor =
      quest.rating === "fast" ? "#84cc16"
        : quest.rating === "short" ? "#22d3ee"
          : quest.rating === "deep" ? "#f59e0b"
            : quest.rating === "hard" ? "#ef4444"
              : "#d1d5db"

    const isPinned = quest.pinned && !isArchived
    const hasCategory = !!(quest.skill && quest.skill !== "none")

    return (
      <div
        key={quest.id}
        className={`${isArchived ? "opacity-50" : quest.completed ? "opacity-70" : ""} ${isPinned ? "cursor-grab active:cursor-grabbing" : ""} ${draggedQuest?.id === quest.id ? "opacity-50" : ""}`}
        draggable={isPinned}
        onDragStart={isPinned ? () => handleDragStart(quest.id, category) : undefined}
        onDragEnd={isPinned ? handleDragEnd : undefined}
        onDragOver={isPinned ? (e) => e.preventDefault() : undefined}
        onDrop={isPinned ? () => handleDrop(quest.id, category) : undefined}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `linear-gradient(to bottom, ${priorityColor}cc, ${priorityColor}44)`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `linear-gradient(to bottom, ${priorityColor}88, ${priorityColor}22)`
        }}
        style={{
          padding: "1px",
          borderRadius: "16px",
          background: `linear-gradient(to bottom, ${priorityColor}88, ${priorityColor}22)`,
          transition: "all 0.4s ease",
        }}
      >
        <div
          style={{
            borderRadius: "15px",
            background: "linear-gradient(to right, rgba(24,24,38,0.95), rgba(14,14,22,0.98))",
            padding: "16px 20px",
            position: "relative",
          }}
        >
          {/* Left Accent Bar */}
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
            {/* Pin icon - positioned relative to checkbox */}
            <div style={{ position: "relative", flexShrink: 0, marginTop: hasCategory ? "12px" : "0px" }}>
              {!isArchived && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0"
                  style={{
                    position: "absolute",
                    top: "-18px",
                    left: "-18px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateQuest(category, quest.id, { pinned: !quest.pinned, pinnedOrder: quest.pinned ? undefined : Date.now() })
                  }}
                >
                  <Pin
                    className="h-3 w-3 rotate-45"
                    style={isPinned ? { color: uiColor, filter: `drop-shadow(0 0 4px ${uiColor})` } : { color: 'var(--muted-foreground)', opacity: 0.15 }}
                  />
                </Button>
              )}

              <Checkbox
                checked={quest.completed}
                onCheckedChange={() => {
                  handleToggleQuest(category, quest.id, quest.xp, quest.completed, quest.title, quest.skill)
                }}
                className="h-5 w-5 border border-gray-300"
                disabled={isArchived}
              />
            </div>

            {/* Title - takes all remaining space */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Category label */}
              {quest.skill && quest.skill !== "none" && (
                <div
                  style={{
                    fontSize: "11px",
                    color: `${priorityColor}99`,
                    fontFamily: "'Crimson Pro', serif",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontStyle: "italic",
                    lineHeight: "1",
                    marginBottom: "2px"
                  }}
                >
                  — {quest.skill} quest
                </div>
              )}

              {/* Quest Title */}
              <h4 className="font-medium text-foreground" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                {quest.title}
              </h4>

              {/* Subtasks - nested inside title block to stay in one row */}
              {quest.subtasks && quest.subtasks.length > 0 && (
                <div className="space-y-1 mt-2">
                  {quest.subtasks.map((subtask: any) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <div
                        className={`h-4 w-4 rounded-full border border-muted-foreground cursor-pointer flex items-center justify-center transition-colors ${subtask.completed ? "bg-primary border-primary" : "hover:border-primary"}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isArchived) return
                          const updatedSubtasks = quest.subtasks.map((s: any) =>
                            s.id === subtask.id ? { ...s, completed: !s.completed } : s
                          )
                          updateQuest(category, quest.id, { subtasks: updatedSubtasks })
                        }}
                      >
                        {subtask.completed && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className={`${subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Archive Button for Completed Tasks */}
              {quest.completed && !isArchived && (
                <div style={{ paddingTop: "8px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleArchiveQuest(category, quest.id, quest.title)
                    }}
                    style={{
                      padding: "8px 28px",
                      borderRadius: "6px",
                      border: `1px solid ${priorityColor}30`,
                      background: "transparent",
                      color: priorityColor,
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "'Crimson Pro', serif",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontStyle: "italic",
                      width: "100%",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    Archive Quest
                  </button>
                </div>
              )}

              {isArchived && (
                <div style={{ paddingTop: "8px" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnarchiveQuest(category, quest.id, quest.xp, quest.skill)
                    }}
                  >
                    Unarchive
                  </Button>
                </div>
              )}
            </div>

            {/* XP + Sparks stacked */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: hasCategory ? "6px" : "0px"
            }}>
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">+{quest.xp} XP</span>
              <span className="text-xs text-orange-500 font-mono whitespace-nowrap flex items-center gap-0.5">
                <Zap className="h-3 w-3" />
                +{(quest as any).reward || (quest.rating === "fast" ? 5 : quest.rating === "short" ? 10 : quest.rating === "deep" ? 25 : quest.rating === "hard" ? 50 : 0)}
              </span>
            </div>

            {/* Edit + Delete + Habit Streak */}
            <div className="flex items-center gap-1 opacity-50 flex-shrink-0 ml-1" style={{ marginTop: hasCategory ? "12px" : "0px" }}>
              {!isArchived && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditQuest(quest, category)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteQuest(category, quest.id, quest.title)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-foreground" />
                  </Button>
                </>
              )}
              {category === "habits" && (
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

  const priorityOrder: Record<string, number> = { fast: 0, short: 1, deep: 2, hard: 3 }

  const getActiveQuests = (category: "plans" | "dailies" | "habits") =>
    quests[category]
      .filter((q: any) => {
        const isActive = q.archivedAt === null
        if (!selectedAreas || selectedAreas.length === 0) return isActive
        return isActive && selectedAreas.includes(q.skill)
      })
      .sort((a: any, b: any) => {
        // Закріплені таски завжди зверху
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        // Серед закріплених - сортування за pinnedOrder
        if (a.pinned && b.pinned) {
          const orderA = a.pinnedOrder ?? Infinity
          const orderB = b.pinnedOrder ?? Infinity
          return orderA - orderB
        }
        // Для незакріплених - сортування за пріоритетом
        const pa = priorityOrder[a.rating] ?? 99
        const pb = priorityOrder[b.rating] ?? 99
        return pa - pb
      })

  const getArchivedQuests = (category: "plans" | "dailies" | "habits") =>
    quests[category]
      .filter((q: any) => {
        if (selectedAreas?.length && !selectedAreas.includes(q.skill)) return false
        const isArchived = q.archivedAt !== null
        if (!selectedAreas || selectedAreas.length === 0) return isArchived
        return isArchived && selectedAreas.includes(q.skill)
      })
      .sort((a: any, b: any) => (a.archivedAt || 0) - (b.archivedAt || 0))

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
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
      <Card className="bg-card border-border" onClick={handleCardClick}>
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

            <div className="mt-4 mb-2"></div>

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
                <Input
                  id="plan-name"
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                  className="bg-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="skill">Area</Label>
                  <Select
                    value={editingQuest.skill || "none"}
                    onValueChange={(value) => setEditingQuest({ ...editingQuest, skill: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="skill" className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No area</SelectItem>
                      {(availableAreas || []).map((skill: string) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Priority</Label>
                  <Select
                    value={editingQuest.rating}
                    onValueChange={(value) => setEditingQuest({ ...editingQuest, rating: value })}
                  >
                    <SelectTrigger id="rating" className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
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
                <Input
                  id="xp-amount"
                  type="number"
                  value={editingQuest.xp}
                  onChange={(e) => setEditingQuest({ ...editingQuest, xp: Number(e.target.value) })}
                  className="bg-input"
                />
              </div>

              {editingQuest.category === "dailies" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="frequency-count">Times</Label>
                    <Select
                      value={String(editingQuest.frequencyCount ?? editingQuest.frequency ?? 1)}
                      onValueChange={(value) =>
                        setEditingQuest({ ...editingQuest, frequencyCount: Number(value) })
                      }
                    >
                      <SelectTrigger id="frequency-count" className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency-period">Per days</Label>
                    <Select
                      value={String(editingQuest.frequencyPeriodDays ?? 1)}
                      onValueChange={(value) =>
                        setEditingQuest({ ...editingQuest, frequencyPeriodDays: Number(value) })
                      }
                    >
                      <SelectTrigger id="frequency-period" className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(14)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-time">Reset Time (UTC)</Label>
                    <Select
                      value={(editingQuest.resetTime || "00:00")}
                      onValueChange={(value) => setEditingQuest({ ...editingQuest, resetTime: value })}
                    >
                      <SelectTrigger id="reset-time" className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(24)].map((_, h) => {
                          const label = `${String(h).padStart(2, "0")}:00`
                          return (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Subtasks Editing */}
              <div className="space-y-3 pt-2 border-t border-border">
                <Label>Subtasks</Label>

                {(editingQuest.subtasks && editingQuest.subtasks.length > 0) ? (
                  <div className="space-y-2">
                    {editingQuest.subtasks.map((subtask, index) => {
                      const isLast = index === (editingQuest.subtasks || []).length - 1
                      return (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <Input
                            value={subtask.title}
                            onChange={(e) => {
                              const newSubtasks = [...(editingQuest.subtasks || [])]
                              newSubtasks[index].title = e.target.value
                              setEditingQuest({ ...editingQuest, subtasks: newSubtasks })
                            }}
                            placeholder="Enter subtask..."
                            className="bg-input h-8 text-sm"
                            autoFocus={isLast && subtask.title === "" && (editingQuest.subtasks || []).length > 1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && isLast) {
                                e.preventDefault()
                                setEditingQuest({
                                  ...editingQuest,
                                  subtasks: [
                                    ...(editingQuest.subtasks || []),
                                    { id: crypto.randomUUID(), title: "", completed: false }
                                  ]
                                })
                              }
                            }}
                          />
                          {isLast ? (
                            <Button
                              onClick={() => {
                                setEditingQuest({
                                  ...editingQuest,
                                  subtasks: [
                                    ...(editingQuest.subtasks || []),
                                    { id: crypto.randomUUID(), title: "", completed: false }
                                  ]
                                })
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 p-0 shrink-0"
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingQuest({
                                  ...editingQuest,
                                  subtasks: editingQuest.subtasks?.filter(s => s.id !== subtask.id)
                                })
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8 flex items-center justify-center shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setEditingQuest({
                        ...editingQuest,
                        subtasks: [
                          { id: crypto.randomUUID(), title: "", completed: false }
                        ]
                      })
                    }}
                    className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Subtask
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuest(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuest} className="bg-primary text-primary-foreground">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
