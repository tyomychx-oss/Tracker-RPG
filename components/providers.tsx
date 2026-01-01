"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// --- Interfaces ---
export interface XPContextType {
  totalXP: number
  currentLevel: number
  maxXP: number
  addXP: (amount: number) => void
  removeXP: (amount: number) => void
  restorePreviousState: (previousLevel: number, previousXP: number, previousMaxXP: number) => void
}

export interface SkillXPContextType {
  skillXPs: Record<string, number>
  addSkillXP: (skill: string, amount: number) => void
  removeSkillXP: (skill: string, amount: number) => void
}

export interface SkillColorsContextType {
  skillColors: Record<string, string>
  setSkillColor: (skill: string, color: string) => void
}

export interface SkillFilterContextType {
  selectedSkill: string | null
  setSelectedSkill: (skill: string | null) => void
}

export interface Quest {
  id: number
  title: string
  skill: string
  xp: number
  rating: string
  completed: boolean
  archivedAt: number | null
  lastCompletedDate: string | null
}

export interface QuestsContextType {
  quests: {
    plans: Quest[]
    dailies: Quest[]
    habits: Quest[]
  }
  addQuest: (category: "plans" | "dailies" | "habits", quest: Quest) => void
  updateQuest: (category: "plans" | "dailies" | "habits", questId: number, updates: Partial<Quest>) => void
  deleteQuest: (category: "plans" | "dailies" | "habits", questId: number) => void
}

export interface RecentActivityContextType {
  activities: Array<{ id: number; action: string; timestamp: number; xp?: number }>
  addActivity: (action: string, xp?: number) => void
}

export interface UIColorContextType {
  uiColor: string
  setUIColor: (color: string) => void
}

export interface NicknameContextType {
  nickname: string
  setNickname: (name: string) => void
}

export interface TaskStateSnapshot {
  questId: number
  previousLevel: number
  previousXP: number
  previousMaxXP: number
  previousSkillXP: number
}

export interface UserProfile {
  nickname: string
  totalXP: number
  currentLevel: number
  maxXP: number
  skillXPs: Record<string, number>
  skillColors: Record<string, string>
  quests: {
    plans: Quest[]
    dailies: Quest[]
    habits: Quest[]
  }
  activities: Array<{ id: number; action: string; timestamp: number; xp?: number }>
  uiColor: string
  taskSnapshots?: Record<number, TaskStateSnapshot>
}

export interface SkillsContextType {
  skills: string[]
  addSkill: (skillName: string, color: string) => void
  removeSkill: (skillName: string) => void
  hasSkills: boolean
}

// --- Contexts ---
const XPContext = createContext<XPContextType | undefined>(undefined)
const SkillXPContext = createContext<SkillXPContextType | undefined>(undefined)
const SkillColorsContext = createContext<SkillColorsContextType | undefined>(undefined)
const SkillFilterContext = createContext<SkillFilterContextType | undefined>(undefined)
const RecentActivityContext = createContext<RecentActivityContextType | undefined>(undefined)
const UIColorContext = createContext<UIColorContextType | undefined>(undefined)
const NicknameContext = createContext<NicknameContextType | undefined>(undefined)
const QuestsContext = createContext<QuestsContextType | undefined>(undefined)
const SkillsContext = createContext<SkillsContextType | undefined>(undefined)

// --- Hooks ---
export function useXP() {
  const context = useContext(XPContext)
  if (!context) throw new Error("useXP must be used within XPProvider")
  return context
}

export function useSkillXP() {
  const context = useContext(SkillXPContext)
  if (!context) throw new Error("useSkillXP must be used within SkillXPProvider")
  return context
}

export function useSkillColors() {
  const context = useContext(SkillColorsContext)
  if (!context) throw new Error("useSkillColors must be used within SkillColorsProvider")
  return context
}

export function useSkillFilter() {
  const context = useContext(SkillFilterContext)
  if (!context) throw new Error("useSkillFilter must be used within SkillFilterProvider")
  return context
}

export function useRecentActivity() {
  const context = useContext(RecentActivityContext)
  if (!context) throw new Error("useRecentActivity must be used within RecentActivityProvider")
  return context
}

export function useUIColor() {
  const context = useContext(UIColorContext)
  if (!context) throw new Error("useUIColor must be used within UIColorProvider")
  return context
}

export function useNickname() {
  const context = useContext(NicknameContext)
  if (!context) throw new Error("useNickname must be used within NicknameProvider")
  return context
}

export function useQuests() {
  const context = useContext(QuestsContext)
  if (!context) throw new Error("useQuests must be used within QuestsProvider")
  return context
}

export function useSkills() {
  const context = useContext(SkillsContext)
  if (!context) throw new Error("useSkills must be used within SkillsProvider")
  return context
}

// --- Providers ---

export function XPProvider({ children }: { children: ReactNode }) {
  const [totalXP, setTotalXP] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [maxXP, setMaxXP] = useState(200)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setTotalXP(profile.totalXP || 0)
      setCurrentLevel(profile.currentLevel || 1)
      setMaxXP(profile.maxXP || 200)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.totalXP = totalXP
      profile.currentLevel = currentLevel
      profile.maxXP = maxXP
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [totalXP, currentLevel, maxXP, isLoaded])

  const calculateTotalXP = (level: number, currentXP: number, currentMaxXP: number): number => {
    let total = currentXP
    let tempLevel = 1
    let tempMax = 200
    while (tempLevel < level) {
      total += tempMax
      tempLevel += 1
      tempMax = Math.floor(tempMax * 1.4)
    }
    return total
  }

  const calculateLevelFromTotalXP = (totalXP: number): { level: number; currentXP: number; maxXP: number } => {
    if (totalXP <= 0) return { level: 1, currentXP: 0, maxXP: 200 }
    let remainingXP = totalXP
    let level = 1
    let maxXP = 200
    while (remainingXP >= maxXP) {
      remainingXP -= maxXP
      level += 1
      maxXP = Math.floor(maxXP * 1.4)
    }
    return { level, currentXP: remainingXP, maxXP }
  }

  const addXP = (amount: number) => {
    setTotalXP((prev) => {
      const totalXPBefore = calculateTotalXP(currentLevel, prev, maxXP)
      const totalXPAfter = totalXPBefore + amount
      const { level, currentXP, maxXP: newMaxXP } = calculateLevelFromTotalXP(totalXPAfter)
      if (level !== currentLevel) {
        setCurrentLevel(level)
        setMaxXP(newMaxXP)
      }
      return currentXP
    })
  }

  const removeXP = (amount: number) => {
    setTotalXP((prev) => {
      const totalXPBefore = calculateTotalXP(currentLevel, prev, maxXP)
      const totalXPAfter = Math.max(0, totalXPBefore - amount)
      const { level, currentXP, maxXP: newMaxXP } = calculateLevelFromTotalXP(totalXPAfter)
      if (level !== currentLevel) {
        setCurrentLevel(level)
        setMaxXP(newMaxXP)
      }
      return currentXP
    })
  }

  const restorePreviousState = (previousLevel: number, previousXP: number, previousMaxXP: number) => {
    setCurrentLevel(previousLevel)
    setTotalXP(previousXP)
    setMaxXP(previousMaxXP)
  }

  return (
    <XPContext.Provider value={{ totalXP, currentLevel, maxXP, addXP, removeXP, restorePreviousState }}>
      {children}
    </XPContext.Provider>
  )
}

export function SkillXPProvider({ children }: { children: ReactNode }) {
  const [skillXPs, setSkillXPs] = useState<Record<string, number>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setSkillXPs(profile.skillXPs || {})
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.skillXPs = skillXPs
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [skillXPs, isLoaded])

  const addSkillXP = (skill: string, amount: number) => {
    setSkillXPs((prev) => ({
      ...prev,
      [skill]: (prev[skill] || 0) + amount,
    }))
  }

  const removeSkillXP = (skill: string, amount: number) => {
    setSkillXPs((prev) => ({
      ...prev,
      [skill]: Math.max(0, (prev[skill] || 0) - amount),
    }))
  }

  return <SkillXPContext.Provider value={{ skillXPs, addSkillXP, removeSkillXP }}>{children}</SkillXPContext.Provider>
}

export function SkillColorsProvider({ children }: { children: ReactNode }) {
  const [skillColors, setSkillColors] = useState<Record<string, string>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setSkillColors(profile.skillColors || {})
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.skillColors = skillColors
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [skillColors, isLoaded])

  const setSkillColor = (skill: string, color: string) => {
    setSkillColors((prev) => ({ ...prev, [skill]: color }))
  }

  return <SkillColorsContext.Provider value={{ skillColors, setSkillColor }}>{children}</SkillColorsContext.Provider>
}

export function SkillFilterProvider({ children }: { children: ReactNode }) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  return (
    <SkillFilterContext.Provider value={{ selectedSkill, setSelectedSkill }}>{children}</SkillFilterContext.Provider>
  )
}

export function QuestsProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState({
    plans: [] as Quest[],
    dailies: [] as Quest[],
    habits: [] as Quest[],
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setQuests(profile.quests || { plans: [], dailies: [], habits: [] })
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.quests = quests
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [quests, isLoaded])

  const addQuest = (category: "plans" | "dailies" | "habits", quest: Quest) => {
    setQuests((prev) => ({
      ...prev,
      [category]: [...prev[category], quest],
    }))
  }

  const updateQuest = (category: "plans" | "dailies" | "habits", questId: number, updates: Partial<Quest>) => {
    setQuests((prev) => ({
      ...prev,
      [category]: prev[category].map((q) => (q.id === questId ? { ...q, ...updates } : q)),
    }))
  }

  const deleteQuest = (category: "plans" | "dailies" | "habits", questId: number) => {
    setQuests((prev) => ({
      ...prev,
      [category]: prev[category].filter((q) => q.id !== questId),
    }))
  }

  return (
    <QuestsContext.Provider value={{ quests, addQuest, updateQuest, deleteQuest }}>{children}</QuestsContext.Provider>
  )
}

export function RecentActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Array<{ id: number; action: string; timestamp: number; xp?: number }>>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setActivities(profile.activities || [])
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.activities = activities
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [activities, isLoaded])

  const addActivity = (action: string, xp?: number) => {
    setActivities((prev) => [{ id: Date.now(), action, timestamp: Date.now(), xp }, ...prev.slice(0, 9)])
  }

  return <RecentActivityContext.Provider value={{ activities, addActivity }}>{children}</RecentActivityContext.Provider>
}

export function UIColorProvider({ children }: { children: ReactNode }) {
  const [uiColor, setUIColor] = useState("#de6550")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setUIColor(profile.uiColor || "#de6550")
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.uiColor = uiColor
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [uiColor, isLoaded])

  return <UIColorContext.Provider value={{ uiColor, setUIColor }}>{children}</UIColorContext.Provider>
}

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState("")

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      setNickname(profile.nickname || "")
    }
  }, [])

  return <NicknameContext.Provider value={{ nickname, setNickname }}>{children}</NicknameContext.Provider>
}

export function SkillsProvider({ children }: { children: ReactNode }) {
  const [skills, setSkills] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      const skillNames = Object.keys(profile.skillColors || {})
      setSkills(skillNames)
    }
    setIsLoaded(true)
  }, [])

  const addSkill = (skillName: string, color: string) => {
    if (!skills.includes(skillName)) {
      setSkills((prev) => [...prev, skillName])
    }
  }

  const removeSkill = (skillName: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillName))
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      if (profile.skillColors) delete profile.skillColors[skillName]
      if (profile.skillXPs) delete profile.skillXPs[skillName]
      if (profile.quests) {
        profile.quests.plans = profile.quests.plans.filter((q) => q.skill !== skillName)
        profile.quests.dailies = profile.quests.dailies.filter((q) => q.skill !== skillName)
        profile.quests.habits = profile.quests.habits.filter((q) => q.skill !== skillName)
      }
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
      window.location.reload()
    }
  }

  const hasSkills = skills.length > 0
  return (
    <SkillsContext.Provider value={{ skills, addSkill, removeSkill, hasSkills }}>{children}</SkillsContext.Provider>
  )
}