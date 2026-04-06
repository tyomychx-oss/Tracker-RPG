"use client"

import { useState, useEffect } from "react"
import { ActiveQuests } from "@/components/active-quests"
import { QuickAdd } from "@/components/quick-add"
import { SkillsList } from "@/components/skills-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Award, Check, X, Trash2, Plus, Archive } from "lucide-react"
import { SyncManager } from "@/components/sync-manager"

// Import hooks
import {
  useRecentActivity,
  useNickname,
  useUIColor,
  useXP,
  useQuests,
  useAreaXP,
  useAreaColors,
  useSparks,
  useAreas,
} from "@/components/providers"

export default function Page() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [tempNickname, setTempNickname] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const { setNickname } = useNickname()
  const { uiColor } = useUIColor()
  const { activities } = useRecentActivity()

  useEffect(() => {
    const updateDevice = () => {
      const width = typeof window !== "undefined" ? window.innerWidth : 1024
      setIsMobile(width < 768)
    }
    updateDevice()
    window.addEventListener("resize", updateDevice)
    return () => window.removeEventListener("resize", updateDevice)
  }, [])

  useEffect(() => {
    setQuickAddOpen(!isMobile)
  }, [isMobile])

  const handleStartTracking = async () => {
    if (!tempNickname.trim()) return

    const { createClient } = await import("@/utils/supabase/client")
    const supabase = createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = "/auth/sign-in"
      return
    }

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: session.user.id,
        nickname: tempNickname.trim(),
        total_xp: 0,
        current_level: 1,
        max_xp: 200,
        skill_xps: {},
        skill_colors: {},
        quests: {
          plans: [],
          dailies: [],
          habits: [],
        },
        activities: [],
        ui_color: "#de6550",
        task_snapshots: {},
        sparks: 0,
        archived_areas: []
      }, {
        onConflict: "user_id"
      })

    if (error) {
      console.error("Error creating profile:", error)
      return
    }

    // Set nickname and trigger SyncManager to proceed
    setNickname(tempNickname.trim())
    setShowOnboarding(false)
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
    }
  }

  return (
    <SyncManager>
      {showOnboarding ? (
        <OnboardingDialog
          nickname={tempNickname}
          setNickname={setTempNickname}
          onStart={handleStartTracking}
        />
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-6" onClick={handleBackgroundClick}>
              <ActiveQuests />
              <SkillsList />
              <div className="mt-6 mb-6">
                {!quickAddOpen ? (
                  <MobileQuickAddButton onOpen={() => setQuickAddOpen(true)} />
                ) : (
                  <QuickAdd />
                )}
              </div>
              {!quickAddOpen && <MobileRecentActivity activities={activities} />}
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6" onClick={handleBackgroundClick}>
              <div className="col-span-5 space-y-6">
                <SkillsList />
              </div>
              <div className="col-span-4">
                <ActiveQuests />
              </div>
              <div className="col-span-3 space-y-6">
                <QuickAdd />
              </div>
            </div>
          )}
        </>
      )}
    </SyncManager>
  )
}

function MobileQuickAddButton({ onOpen }: { onOpen: () => void }) {
  const { uiColor } = useUIColor()
  return (
    <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: uiColor }} onClick={onOpen}>
      + QUICK ADD
    </Button>
  )
}

function MobileRecentActivity({ activities }: { activities: any[] }) {
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
    if (action.startsWith("Completed:")) {
      return {
        icon: Check,
        label: "Completed",
        bgColor: "bg-green-500/10",
        textColor: "text-green-500",
      }
    }
    if (action.startsWith("Uncompleted:")) {
      return {
        icon: X,
        label: "Uncompleted",
        bgColor: "bg-orange-500/10",
        textColor: "text-orange-500",
      }
    }
    if (action.startsWith("Archived:")) {
      return {
        icon: Archive,
        label: "Archived",
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-500",
      }
    }
    if (action.startsWith("Deleted:")) {
      return {
        icon: Trash2,
        label: "Deleted",
        bgColor: "bg-red-500/10",
        textColor: "text-red-500",
      }
    }
    if (action.startsWith("Added:") || action.startsWith("Created:")) {
      return {
        icon: Plus,
        label: "Added",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-500",
      }
    }
    return {
      icon: Award,
      label: "Activity",
      bgColor: "bg-gray-500/10",
      textColor: "text-gray-500",
    }
  }

  const getActionTitle = (action: string) => {
    const colonIndex = action.indexOf(":")
    if (colonIndex !== -1) {
      return action.slice(colonIndex + 1).trim()
    }
    return action
  }

  return (
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
          activities.slice(0, 10).map((activity) => {
            const config = getActivityConfig(activity.action)
            const Icon = config.icon
            return (
              <div key={activity.id} className="flex items-center justify-between text-sm group hover:bg-muted/50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-1.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium text-foreground">{getActionTitle(activity.action)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{config.label}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  {activity.xp !== undefined && activity.xp !== null && (
                    <span className="font-mono text-xs font-bold" style={{ color: activity.xp >= 0 ? "#22c55e" : "#f97316" }}>
                      {activity.xp > 0 ? "+" : ""}{activity.xp} XP
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function OnboardingDialog({
  nickname,
  setNickname,
  onStart,
}: {
  nickname: string
  setNickname: (name: string) => void
  onStart: () => void
}) {
  const { setNickname: setGlobalNickname } = useNickname()

  const handleSubmit = () => {
    if (nickname.trim()) {
      setGlobalNickname(nickname)
      onStart()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Dialog open={true}>
        <DialogContent className="bg-card border-border sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center font-mono text-primary">
              WELCOME TO VIBECODING TRACKER
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <p className="text-center text-muted-foreground">
              Start your journey to level up your areas and track your progress like an RPG character.
            </p>
            <div className="space-y-3">
              <Label htmlFor="onboarding-nickname" className="text-foreground">
                Enter your name
              </Label>
              <Input
                id="onboarding-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-input"
                placeholder="Your name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={!nickname.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Start Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
