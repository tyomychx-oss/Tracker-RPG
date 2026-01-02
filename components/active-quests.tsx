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
import { Pencil, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useXP, useSkillColors, useSkillFilter, useRecentActivity, useUIColor, useSkillXP, useQuests, useSkills } from "@/components/providers"

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
  const { addSkillXP, removeSkillXP, skillXPs } = useSkillXP()
  const { skillColors } = useSkillColors()
  const { archivedSkills } = useSkills()
  const [selectedFilterSkill, setSelectedFilterSkill] = useState<string>("All")
  const { selectedSkill, setSelectedSkill } = useSkillFilter()
  const { addActivity } = useRecentActivity()
  const { uiColor } = useUIColor()
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
  } | null>(null)

  const [taskSnapshots, setTaskSnapshots] = useState<Record<number, TaskStateSnapshot>>({})
  const [isSnapshotsLoaded, setIsSnapshotsLoaded] = useState(false)

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

  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date()
      const today = now.toDateString()
      ;(["dailies", "habits"] as const).forEach((category) => {
        quests[category].forEach((quest: any) => {
          if (quest.completed && quest.lastCompletedDate !== today) {
            updateQuest(category, quest.id, {
              completed: false,
              lastCompletedDate: null,
            })
          }
        })
      })
    }

    checkDailyReset()
    const interval = setInterval(checkDailyReset, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [quests])

  const handleToggleQuest = (
    category: "plans" | "dailies" | "habits",
    questId: number,
    xpAmount: number,
    isCompleted: boolean,
    questTitle: string,
    skillName: string,
  ) => {
    const today = new Date().toDateString()

    if (isCompleted) {
      const snapshot = taskSnapshots[questId]
      if (snapshot) {
        // Use snapshot to restore exact previous state
        restorePreviousState(snapshot.previousLevel, snapshot.previousXP, snapshot.previousMaxXP)
        // Restore skill XP to previous amount
        const currentSkillXP = skillXPs[skillName] || 0
        const xpToRemove = currentSkillXP - snapshot.previousSkillXP
        if (xpToRemove > 0) {
          removeSkillXP(skillName, xpToRemove)
        }
        // Remove snapshot
        setTaskSnapshots((prev) => {
          const newSnapshots = { ...prev }
          delete newSnapshots[questId]
          return newSnapshots
        })
      } else {
        // Fallback: if snapshot is lost, use removeXP (which now handles level decreases properly)
        removeXP(xpAmount)
        removeSkillXP(skillName, xpAmount)
      }
      addActivity(`Uncompleted: ${questTitle}`, -xpAmount, category)
      updateQuest(category, questId, { completed: false, lastCompletedDate: null })
    } else {
      const snapshot: TaskStateSnapshot = {
        questId,
        previousLevel: currentLevel,
        previousXP: totalXP,
        previousMaxXP: maxXP,
        previousSkillXP: skillXPs[skillName] || 0,
      }
      setTaskSnapshots((prev) => ({ ...prev, [questId]: snapshot }))

      // Add XP
      addXP(xpAmount)
      addSkillXP(skillName, xpAmount)
      addActivity(`Completed: ${questTitle}`, xpAmount, category)
      updateQuest(category, questId, { completed: true, lastCompletedDate: today })
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
    removeSkillXP(skillName, xpAmount)
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
    })
  }

  const handleSaveQuest = () => {
    if (!editingQuest) return

    updateQuest(editingQuest.category, editingQuest.id, {
      title: editingQuest.title,
      skill: editingQuest.skill,
      xp: editingQuest.xp,
      rating: editingQuest.rating,
    })
    setEditingQuest(null)
  }

  const handleDeleteQuest = (category: "plans" | "dailies" | "habits", questId: number, questTitle: string) => {
    deleteQuest(category, questId)
    addActivity(`Deleted: ${questTitle}`)
  }

  const BASIC_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#10b981",
    "#059669",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#a855f7",
  ]

  const getSkillColor = (skillName: string) => {
    if (skillColors[skillName]) return skillColors[skillName]
    
    // Generate a deterministic color index based on skill name string
    let hash = 0
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const index = Math.abs(hash) % BASIC_COLORS.length
    return BASIC_COLORS[index]
  }

  const renderQuestCard = (quest: any, category: "plans" | "dailies" | "habits", isArchived = false) => {
    const skillColor = getSkillColor(quest.skill)

    return (
      <Card
        key={quest.id}
        className={`bg-card border-border ${isArchived ? "opacity-50" : quest.completed ? "opacity-70" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={quest.completed}
              onCheckedChange={() => {
                handleToggleQuest(category, quest.id, quest.xp, quest.completed, quest.title, quest.skill)
              }}
              className="mt-1"
              disabled={isArchived}
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-foreground">{quest.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">+{quest.xp} XP</span>
                  <Badge
                    variant="outline"
                    className="text-xs border"
                    style={{
                      backgroundColor: `${skillColor}20`,
                      color: skillColor,
                      borderColor: skillColor,
                      fontSize: "0.65rem",
                      padding: "0.125rem 0.375rem",
                    }}
                  >
                    {quest.skill}
                  </Badge>
                  {!isArchived && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                        onClick={() => handleEditQuest(quest, category)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-destructive/20"
                        onClick={() => handleDeleteQuest(category, quest.id, quest.title)}
                      >
                        <Trash2 className="h-3 w-3 text-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {quest.completed && !isArchived && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs bg-transparent"
                  onClick={() => handleArchiveQuest(category, quest.id, quest.title)}
                >
                  Archive
                </Button>
              )}
              {isArchived && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs bg-transparent"
                  onClick={() => handleUnarchiveQuest(category, quest.id, quest.xp, quest.skill)}
                >
                  Unarchive
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getActiveQuests = (category: "plans" | "dailies" | "habits") =>
    quests[category].filter((q: any) => {
      if (archivedSkills?.includes(q.skill)) return false
      const isActive = q.archivedAt === null
      if (selectedFilterSkill === "All") return isActive
      return isActive && q.skill === selectedFilterSkill
    })

  const getArchivedQuests = (category: "plans" | "dailies" | "habits") =>
    quests[category]
      .filter((q: any) => {
        if (archivedSkills?.includes(q.skill)) return false
        const isArchived = q.archivedAt !== null
        if (selectedFilterSkill === "All") return isArchived
        return isArchived && q.skill === selectedFilterSkill
      })
      .sort((a: any, b: any) => (a.archivedAt || 0) - (b.archivedAt || 0))

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const allSkills = Array.from(new Set([...quests.plans, ...quests.dailies, ...quests.habits].map((q: any) => q.skill)))
    .filter(skill => !archivedSkills?.includes(skill))

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
    <>
      <Card className="bg-card border-border" onClick={handleCardClick}>
        <CardHeader>
          <CardTitle className="text-foreground font-mono" style={{ color: uiColor }}>
            ACTIVE QUESTS
            {selectedFilterSkill !== "All" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Filtered by {selectedFilterSkill})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dailies" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="dailies">Daily</TabsTrigger>
              <TabsTrigger value="plans">Tasks</TabsTrigger>
              <TabsTrigger value="habits">Habits</TabsTrigger>
            </TabsList>

            <div className="mt-4 mb-2">
              <Select value={selectedFilterSkill} onValueChange={setSelectedFilterSkill}>
                <SelectTrigger className="w-full bg-input">
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Skills</SelectItem>
                  {allSkills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="plans">{renderTabContent("plans")}</TabsContent>
            <TabsContent value="dailies">{renderTabContent("dailies")}</TabsContent>
            <TabsContent value="habits">{renderTabContent("habits")}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!editingQuest} onOpenChange={(open) => !open && setEditingQuest(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary font-mono">EDIT QUEST</DialogTitle>
          </DialogHeader>
          {editingQuest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill">Which Skill</Label>
                <Select
                  value={editingQuest.skill}
                  onValueChange={(value) => setEditingQuest({ ...editingQuest, skill: value })}
                >
                  <SelectTrigger id="skill" className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Branding">Branding</SelectItem>
                    <SelectItem value="Sport">Sport</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label htmlFor="rating">Skill Rating</Label>
                <Select
                  value={editingQuest.rating}
                  onValueChange={(value) => setEditingQuest({ ...editingQuest, rating: value })}
                >
                  <SelectTrigger id="rating" className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
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
    </>
  )
}
