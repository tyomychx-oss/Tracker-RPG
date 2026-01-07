"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ActiveQuests } from "@/components/active-quests"
import { QuickAdd } from "@/components/quick-add"
import { SkillsList } from "@/components/skills-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

// ІМПОРТУЄМО все з нового файлу
import { 
  XPProvider, 
  QuestsProvider, 
  AreaXPProvider, 
  AreaColorsProvider, 
  AreasProvider, 
  AreaFilterProvider, 
  RecentActivityProvider, 
  UIColorProvider, 
  NicknameProvider,
  useNickname,
  type UserProfile 
} from "@/components/providers"

export default function Page() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [tempNickname, setTempNickname] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { createClient } = await import("@/utils/supabase/client")
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = "/auth/sign-in"
        return
      }

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (error || !profile || !profile.nickname) {
        const nicknameFromMetadata = session.user.user_metadata?.nickname
        
        if (nicknameFromMetadata) {
          await supabase
            .from("user_profiles")
            .upsert({
              user_id: session.user.id,
              nickname: nicknameFromMetadata,
              total_xp: 0,
              current_level: 1,
              max_xp: 200,
              skill_xps: {},
              skill_colors: {},
              quests: { plans: [], dailies: [], habits: [] },
              activities: [],
              ui_color: "#de6550",
              task_snapshots: {},
            }, {
              onConflict: "user_id"
            })
          
          const newProfile: UserProfile = {
            nickname: nicknameFromMetadata,
            totalXP: 0,
            currentLevel: 1,
            maxXP: 200,
            skillXPs: {},
            skillColors: {},
            quests: { plans: [], dailies: [], habits: [] },
            activities: [],
            uiColor: "#de6550",
            taskSnapshots: {},
          }
          
          localStorage.setItem("currentUserProfile", JSON.stringify(newProfile))
          setIsCheckingAuth(false) 
          return
        }
        
        setShowOnboarding(true)
        setIsCheckingAuth(false)
        return
      }

      const userProfile: UserProfile = {
        nickname: profile.nickname || "",
        totalXP: profile.total_xp || 0,
        currentLevel: profile.current_level || 1,
        maxXP: profile.max_xp || 200,
        skillXPs: profile.skill_xps || {},
        skillColors: profile.skill_colors || {},
        quests: profile.quests || { plans: [], dailies: [], habits: [] },
        activities: profile.activities || [],
        uiColor: profile.ui_color || "#de6550",
        taskSnapshots: profile.task_snapshots || {},
      }
      
      localStorage.setItem("currentUserProfile", JSON.stringify(userProfile))
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [])

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
      }, {
        onConflict: "user_id"
      })

    if (error) {
      console.error("Error creating profile:", error)
      return
    }

    const newProfile: UserProfile = {
      nickname: tempNickname.trim(),
      totalXP: 0,
      currentLevel: 1,
      maxXP: 200,
      skillXPs: {},
      skillColors: {},
      quests: { plans: [], dailies: [], habits: [] },
      activities: [],
      uiColor: "#de6550",
      taskSnapshots: {},
    }
    
    localStorage.setItem("currentUserProfile", JSON.stringify(newProfile))
    setShowOnboarding(false)
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
    }
  }

  return (
    <XPProvider>
      <QuestsProvider>
        <AreaXPProvider>
          <AreaColorsProvider>
            <AreasProvider>
              <AreaFilterProvider>
                <RecentActivityProvider>
                  <UIColorProvider>
                    <NicknameProvider>
                      {isCheckingAuth ? (
                        <div className="min-h-screen bg-background flex items-center justify-center">
                          <div className="text-muted-foreground">Loading...</div>
                        </div>
                      ) : showOnboarding ? (
                        <OnboardingDialog
                          nickname={tempNickname}
                          setNickname={setTempNickname}
                          onStart={handleStartTracking}
                        />
                      ) : (
                        <DashboardLayout>
                          {isMobile ? (
                            <div className="space-y-6" onClick={handleBackgroundClick}>
                              <ActiveQuests />
                              <SkillsList />
                              <div>
                                {!quickAddOpen ? (
                                  <div
                                    className="bg-card border border-border rounded-md px-4 py-3 text-center text-sm text-muted-foreground cursor-pointer hover:bg-muted"
                                    onClick={() => setQuickAddOpen(true)}
                                  >
                                    QUICK ADD
                                  </div>
                                ) : (
                                  <QuickAdd />
                                )}
                              </div>
                              {/* RECENT ACTIVITY already inside QuickAdd; keeping order by rendering QuickAdd at third position */}
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
                        </DashboardLayout>
                      )}
                    </NicknameProvider>
                  </UIColorProvider>
                </RecentActivityProvider>
              </AreaFilterProvider>
            </AreasProvider>
          </AreaColorsProvider>
        </AreaXPProvider>
      </QuestsProvider>
    </XPProvider>
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
