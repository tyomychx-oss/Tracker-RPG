import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Award, X } from "lucide-react"
import { useRecentActivity, useUIColor, useQuests, useAreas } from "@/components/providers"

export function QuickAdd() {
  const [taskName, setTaskName] = useState("")
  const [taskType, setTaskType] = useState("plans")
  const [taskSkill, setTaskSkill] = useState("")
  const [taskXP, setTaskXP] = useState("25")
  const [taskPriority, setTaskPriority] = useState("short")
  const [dailyCount, setDailyCount] = useState("1")
  const [dailyPeriodDays, setDailyPeriodDays] = useState("1")
  const [dailyResetTime, setDailyResetTime] = useState("00:00")

  // Subtasks State
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([])

  const { activities } = useRecentActivity()
  const { uiColor } = useUIColor()
  const { addQuest } = useQuests()
  const { areas: availableAreas } = useAreas()

  const handleAddSubtask = () => {
    setSubtasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        completed: false,
      },
    ])
  }

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }

  const handleAddTask = () => {
    if (!taskName.trim()) return

    const base = {
      id: Date.now(),
      title: taskName,
      skill: taskSkill === "none" ? "" : taskSkill,
      xp: Number(taskXP || "25"),
      rating: taskPriority || "short",
      completed: false,
      archivedAt: null,
      lastCompletedDate: null,

      subtasks: showSubtasks ? subtasks.filter(s => s.title.trim() !== "") : [],
      reward: taskPriority === "fast" ? 5 :
        taskPriority === "short" ? 10 :
          taskPriority === "deep" ? 25 :
            taskPriority === "hard" ? 50 : 0,
    } as any

    if (taskType === "dailies") {
      base.frequencyCount = Number(dailyCount || "1")
      base.frequencyPeriodDays = Number(dailyPeriodDays || "1")
      base.resetTime = dailyResetTime || "00:00"
      base.completedCount = 0
      base.lastResetDate = new Date().toDateString()
      base.periodStartAt = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
    }
    if (taskType === "habits") {
      base.streak = 0
    }

    addQuest(taskType as "plans" | "dailies" | "habits", base)

    // Reset form
    setTaskName("")
    setTaskXP("25")
    setShowSubtasks(false)
    setSubtasks([])
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
          <CardTitle className="flex items-center gap-2" style={{ color: uiColor }}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Area
              </Label>
              <Select value={taskSkill || "none"} onValueChange={setTaskSkill}>
                <SelectTrigger id="task-skill" className="bg-input">
                  <SelectValue placeholder="No area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No area</SelectItem>
                  {(availableAreas || []).map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
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
              placeholder="25"
              value={taskXP}
              onChange={(e) => setTaskXP(e.target.value)}
              className="bg-input font-mono"
            />
          </div>


          {taskType === "dailies" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-count" className="text-foreground">
                  Times
                </Label>
                <Select value={dailyCount} onValueChange={setDailyCount}>
                  <SelectTrigger id="task-count" className="bg-input">
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
                <Label htmlFor="task-period" className="text-foreground">
                  Per days
                </Label>
                <Select value={dailyPeriodDays} onValueChange={setDailyPeriodDays}>
                  <SelectTrigger id="task-period" className="bg-input">
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
                <Label htmlFor="task-reset" className="text-foreground">
                  Reset Time (UTC)
                </Label>
                <Select value={dailyResetTime} onValueChange={setDailyResetTime}>
                  <SelectTrigger id="task-reset" className="bg-input">
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

          {/* Subtasks Section */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch
                id="add-subtasks"
                checked={showSubtasks}
                onCheckedChange={(checked) => {
                  setShowSubtasks(checked)
                  if (checked && subtasks.length === 0) {
                    setSubtasks([{ id: crypto.randomUUID(), title: "", completed: false }])
                  }
                }}
              />
              <Label htmlFor="add-subtasks" className="text-foreground cursor-pointer">
                Add Subtasks
              </Label>
            </div>

            {showSubtasks && (
              <div className="space-y-3 pl-2 border-l-2 border-border ml-1">
                <div className="space-y-2">
                  {subtasks.map((subtask, index) => {
                    const isLast = index === subtasks.length - 1
                    return (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <Input
                          value={subtask.title}
                          onChange={(e) => {
                            const newSubtasks = [...subtasks]
                            newSubtasks[index].title = e.target.value
                            setSubtasks(newSubtasks)
                          }}
                          placeholder="Enter subtask..."
                          className="bg-input h-8 text-sm"
                          autoFocus={isLast && subtask.title === "" && subtasks.length > 1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && isLast) {
                              e.preventDefault()
                              handleAddSubtask()
                            }
                          }}
                        />
                        {isLast ? (
                          <Button
                            onClick={handleAddSubtask}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 p-0 shrink-0"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <button
                            onClick={() => handleRemoveSubtask(subtask.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8 flex items-center justify-center shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {subtasks.length === 0 && (
                    <Button
                      onClick={handleAddSubtask}
                      className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Subtask
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
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
