"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Award, X, Check, Trash2, Archive } from "lucide-react"
import { useRecentActivity, useUIColor, useQuests, useAreas } from "@/components/providers"
import { updateProfile, updateQuestsTable } from "@/lib/supabase-actions"

export function QuickAdd() {
    const [taskName, setTaskName] = useState("")
    const [taskType, setTaskType] = useState("plans")
    const [taskSkill, setTaskSkill] = useState("")
    const [taskXP, setTaskXP] = useState("25")
    const [taskPriority, setTaskPriority] = useState("short")
    const [dailyCount, setDailyCount] = useState("1")
    const [dailyPeriodDays, setDailyPeriodDays] = useState("1")
    const [dailyResetTime, setDailyResetTime] = useState("00:00")
    const [habitWeeklyTarget, setHabitWeeklyTarget] = useState("3")

    const [showSubtasks, setShowSubtasks] = useState(false)
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([])

    const nameRef = useRef<HTMLInputElement | null>(null)
    const DRAFT_KEY = "quickAddDraft_v1"

    const { activities, setActivities } = useRecentActivity()
    const { uiColor } = useUIColor()
    const { quests, setQuests, setLastUpdated } = useQuests()
    const { areas: availableAreas } = useAreas()

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY)
            if (!raw) return
            const draft = JSON.parse(raw)
            if (draft?.taskName) setTaskName(draft.taskName)
            if (draft?.taskType) setTaskType(draft.taskType)
            if (draft?.taskSkill) setTaskSkill(draft.taskSkill)
            if (draft?.taskXP) setTaskXP(draft.taskXP)
            if (draft?.taskPriority) setTaskPriority(draft.taskPriority)
            if (draft?.dailyCount) setDailyCount(draft.dailyCount)
            if (draft?.dailyPeriodDays) setDailyPeriodDays(draft.dailyPeriodDays)
            if (draft?.dailyResetTime) setDailyResetTime(draft.dailyResetTime)
            if (draft?.habitWeeklyTarget) setHabitWeeklyTarget(draft.habitWeeklyTarget)
            if (draft?.showSubtasks) setShowSubtasks(draft.showSubtasks)
            if (Array.isArray(draft?.subtasks)) setSubtasks(draft.subtasks)
        } catch { }
    }, [])

    useEffect(() => {
        try {
            const draft = { taskName, taskType, taskSkill, taskXP, taskPriority, dailyCount, dailyPeriodDays, dailyResetTime, habitWeeklyTarget, showSubtasks, subtasks }
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
        } catch { }
    }, [taskName, taskType, taskSkill, taskXP, taskPriority, dailyCount, dailyPeriodDays, dailyResetTime, habitWeeklyTarget, showSubtasks, subtasks])

    const handleAddSubtask = () => {
        setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: "", completed: false }])
    }

    const handleRemoveSubtask = (id: string) => {
        setSubtasks((prev) => prev.filter((s) => s.id !== id))
    }

    const handleAddTask = async () => {
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
            pinned: false,
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
            base.taskType = "habit"
            base.streak = 0
            base.weeklyTarget = Number(habitWeeklyTarget || "3")
            base.currentWeeklyProgress = 0
        }

        const newQuests = JSON.parse(JSON.stringify(quests))
        newQuests[taskType].push(base)

        const newActivities = [
            { id: Date.now(), action: `Added: ${taskName}`, timestamp: Date.now(), type: taskType as "plans" | "dailies" | "habits" },
            ...activities
        ]

        // 1. SPLIT LOGIC: Dailies go to SQL Table, Others to JSONB
        if (taskType === "dailies") {
            const sqlPayload = {
                category: 'dailies' as const,
                title: taskName,
                skill: taskSkill === "none" ? "" : taskSkill,
                xp: Number(taskXP || "25"),
                rating: taskPriority || "short",
                frequency_count: Number(dailyCount || "1"),
                frequency_period_days: Number(dailyPeriodDays || "1"),
                reset_time: dailyResetTime || "00:00",
                is_completed: false,
                is_archived: false,
                last_completed_at: null,
                id: crypto.randomUUID()
            }

            // OPTIMISTIC UPDATE
            const newQuests = { ...quests, dailies: [...quests.dailies, sqlPayload] }
            setQuests(newQuests)
            setActivities(newActivities as any)
            setLastUpdated(Date.now())

            try {
                await updateQuestsTable([sqlPayload])
                await updateProfile({ activities: newActivities.slice(0, 100) })
                setTaskName("")
                setTaskXP("25")
                setShowSubtasks(false)
                setSubtasks([])
                sessionStorage.removeItem(DRAFT_KEY)
            } catch (err) {
                console.error("Failed to add SQL daily:", err)
            }
        } else {
            // ORIGINAL JSONB LOGIC for Plans and Habits
            const newQuests = JSON.parse(JSON.stringify(quests))
            newQuests[taskType].push(base)

            // OPTIMISTIC UPDATE
            setQuests(newQuests)
            setActivities(newActivities as any)
            setLastUpdated(Date.now())

            try {
                const { error } = await updateProfile({
                    quests: newQuests,
                    activities: newActivities.slice(0, 100)
                })

                if (!error) {
                    setQuests(newQuests)
                }
                setTaskName("")
                setTaskXP("25")
                setShowSubtasks(false)
                setSubtasks([])
                sessionStorage.removeItem(DRAFT_KEY)
            } catch (err) {
                console.error("Failed to add JSON task:", err)
            }
        }
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

    const getActivityConfig = (action: string) => {
        if (action.startsWith("Completed:")) return { icon: Check, label: "Completed", bgColor: "bg-green-500/10", textColor: "text-green-500" }
        if (action.startsWith("Uncompleted:")) return { icon: X, label: "Uncompleted", bgColor: "bg-orange-500/10", textColor: "text-orange-500" }
        if (action.startsWith("Archived:")) return { icon: Archive, label: "Archived", bgColor: "bg-blue-500/10", textColor: "text-blue-500" }
        if (action.startsWith("Deleted:")) return { icon: Trash2, label: "Deleted", bgColor: "bg-red-500/10", textColor: "text-red-500" }
        if (action.startsWith("Added:") || action.startsWith("Created:")) return { icon: Plus, label: "Added", bgColor: "bg-emerald-500/10", textColor: "text-emerald-500" }
        return { icon: Award, label: "Activity", bgColor: "bg-gray-500/10", textColor: "text-gray-500" }
    }

    const getActionTitle = (action: string) => {
        const colonIndex = action.indexOf(":")
        return colonIndex !== -1 ? action.slice(colonIndex + 1).trim() : action
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
                        <Label htmlFor="task-name" className="text-foreground">Task Name</Label>
                        <Input id="task-name" placeholder="Enter task name..." ref={nameRef} value={taskName} onChange={(e) => setTaskName(e.target.value)} className="bg-input" autoComplete="off" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-type" className="text-foreground">Type</Label>
                            <Select value={taskType} onValueChange={setTaskType}>
                                <SelectTrigger id="task-type" className="bg-input"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="plans">Task</SelectItem>
                                    <SelectItem value="dailies">Daily</SelectItem>
                                    <SelectItem value="habits">Habit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-skill" className="text-foreground">Area</Label>
                            <Select value={taskSkill || "none"} onValueChange={setTaskSkill}>
                                <SelectTrigger id="task-skill" className="bg-input"><SelectValue placeholder="No area" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No area</SelectItem>
                                    {(availableAreas || []).map((skill) => (<SelectItem key={skill} value={skill}>{skill}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-priority" className="text-foreground">Priority</Label>
                            <Select value={taskPriority} onValueChange={setTaskPriority}>
                                <SelectTrigger id="task-priority" className="bg-input"><SelectValue /></SelectTrigger>
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
                            {taskType === "habits" ? "XP Reward (per session)" : "XP Reward"}
                        </Label>
                        <Input id="task-xp" type="number" placeholder="25" value={taskXP} onChange={(e) => setTaskXP(e.target.value)} className="bg-input font-mono" />
                    </div>

                    {taskType === "dailies" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-count" className="text-foreground">Times</Label>
                                <Select value={dailyCount} onValueChange={setDailyCount}>
                                    <SelectTrigger id="task-count" className="bg-input"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[...Array(10)].map((_, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="task-period" className="text-foreground">Per days</Label>
                                <Select value={dailyPeriodDays} onValueChange={setDailyPeriodDays}>
                                    <SelectTrigger id="task-period" className="bg-input"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[...Array(14)].map((_, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="task-reset" className="text-foreground">Reset Time (UTC)</Label>
                                <Select value={dailyResetTime} onValueChange={setDailyResetTime}>
                                    <SelectTrigger id="task-reset" className="bg-input"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[...Array(24)].map((_, h) => { const label = `${String(h).padStart(2, "0")}:00`; return (<SelectItem key={label} value={label}>{label}</SelectItem>) })}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {taskType === "habits" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="habit-weekly-target" className="text-foreground">Times per Week</Label>
                                <Select value={habitWeeklyTarget} onValueChange={setHabitWeeklyTarget}>
                                    <SelectTrigger id="habit-weekly-target" className="bg-input"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[...Array(7)].map((_, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{i + 1} {(i + 1) === 1 ? 'time' : 'times'}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                            <Switch id="add-subtasks" checked={showSubtasks} onCheckedChange={(checked) => { setShowSubtasks(checked); if (checked && subtasks.length === 0) setSubtasks([{ id: crypto.randomUUID(), title: "", completed: false }]) }} />
                            <Label htmlFor="add-subtasks" className="text-foreground cursor-pointer">Add Subtasks</Label>
                        </div>
                        {showSubtasks && (
                            <div className="space-y-3 pl-2 border-l-2 border-border ml-1">
                                {subtasks.map((subtask, index) => (
                                    <div key={subtask.id} className="flex items-center gap-2">
                                        <Input value={subtask.title} onChange={(e) => { const n = [...subtasks]; n[index].title = e.target.value; setSubtasks(n) }} placeholder="Enter subtask..." className="bg-input h-8 text-sm" />
                                        <button onClick={() => setSubtasks(subtasks.filter(s => s.id !== subtask.id))} className="text-muted-foreground hover:text-destructive h-8 w-8 flex items-center justify-center shrink-0"><X className="h-4 w-4" /></button>
                                    </div>
                                ))}
                                <Button onClick={handleAddSubtask} className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Subtask</Button>
                            </div>
                        )}
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddTask}>
                        <Plus className="mr-2 h-4 w-4" /> Add Task
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Award className="h-4 w-4" /> RECENT ACTIVITY
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    {activities.length === 0 ? (<div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>) : (
                        activities.slice(0, 10).map((activity) => {
                            const config = getActivityConfig(activity.action)
                            const Icon = config.icon
                            return (
                                <div key={activity.id} className="flex items-center justify-between text-sm group hover:bg-muted/50 py-1 px-2 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-1.5 rounded-full ${config.bgColor} ${config.textColor}`}><Icon className="h-3 w-3" /></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate font-medium text-foreground">{getActionTitle(activity.action)}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{config.label}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 pl-2">
                                        {activity.xp && (<span className="font-mono text-xs font-bold" style={{ color: activity.xp >= 0 ? "#22c55e" : "#f97316" }}>{activity.xp > 0 ? "+" : ""}{activity.xp} XP</span>)}
                                        <span className="text-[10px] text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
