"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Award } from "lucide-react"
import { useRecentActivity, useUIColor, useQuests, useSkills } from "@/components/providers"

export function QuickAdd() {
  const [taskName, setTaskName] = useState("")
  const [taskType, setTaskType] = useState("plans")
  const [taskSkill, setTaskSkill] = useState("")
  const [taskXP, setTaskXP] = useState("50")
  const [taskPriority, setTaskPriority] = useState("daily")
  const { activities } = useRecentActivity()
  const { uiColor } = useUIColor()
  const { addQuest } = useQuests()
  const { skills: availableSkills } = useSkills()

  const handleAddTask = () => {
    if (!taskName.trim() || !taskSkill) return

    addQuest(taskType as "plans" | "dailies" | "habits", {
      id: Date.now(),
      title: taskName,
      skill: taskSkill,
      xp: Number(taskXP),
      rating: taskPriority,
      completed: false,
      archivedAt: null,
      lastCompletedDate: null,
    })

    // Reset form
    setTaskName("")
    setTaskXP("50")
  }

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono flex items-center gap-2" style={{ color: uiColor }}>
            <Plus className="h-5 w-5" />
            QUICK ADD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name" className="text-foreground">
              Task Name
            </Label>
            <Input
              id="task-name"
              placeholder="Enter task name..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-type" className="text-foreground">
                Type
              </Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger id="task-type" className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plans">Task</SelectItem>
                  <SelectItem value="dailies">Daily</SelectItem>
                  <SelectItem value="habits">Habit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-skill" className="text-foreground">
                Skill
              </Label>
              <Select value={taskSkill} onValueChange={setTaskSkill}>
                <SelectTrigger id="task-skill" className="bg-input">
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      Create a skill first in the Skills tab
                    </div>
                  ) : (
                    availableSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-xp" className="text-foreground">
              XP Reward
            </Label>
            <Input
              id="task-xp"
              type="number"
              placeholder="50"
              value={taskXP}
              onChange={(e) => setTaskXP(e.target.value)}
              className="bg-input font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-priority" className="text-foreground">
              Priority
            </Label>
            <Select value={taskPriority} onValueChange={setTaskPriority}>
              <SelectTrigger id="task-priority" className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4" />
            RECENT ACTIVITY
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
          ) : (
            activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start justify-between text-sm gap-3">
                <span className="text-foreground flex-1">{activity.action}</span>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {activity.xp && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {activity.xp > 0 ? "+" : ""}
                      {activity.xp} XP
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
