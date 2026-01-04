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

export interface AreaXPContextType {
  areaXPs: Record<string, number>
  addAreaXP: (area: string, amount: number) => void
  removeAreaXP: (area: string, amount: number) => void
}

export interface AreaColorsContextType {
  areaColors: Record<string, string>
  setAreaColor: (area: string, color: string) => void
}

export interface AreaFilterContextType {
  selectedAreas: string[]
  toggleArea: (area: string) => void
  clearAreas: () => void
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

export interface AreasContextType {
  areas: string[]
  addArea: (areaName: string, color: string) => void
  removeArea: (areaName: string) => void
  hasAreas: boolean
  archivedAreas: string[]
  archiveArea: (areaName: string) => void
  unarchiveArea: (areaName: string) => void
}

// --- Contexts ---
const XPContext = createContext<XPContextType | undefined>(undefined)
const AreaXPContext = createContext<AreaXPContextType | undefined>(undefined)
const AreaColorsContext = createContext<AreaColorsContextType | undefined>(undefined)
const AreaFilterContext = createContext<AreaFilterContextType | undefined>(undefined)
const RecentActivityContext = createContext<RecentActivityContextType | undefined>(undefined)
const UIColorContext = createContext<UIColorContextType | undefined>(undefined)
const NicknameContext = createContext<NicknameContextType | undefined>(undefined)
const QuestsContext = createContext<QuestsContextType | undefined>(undefined)
const AreasContext = createContext<AreasContextType | undefined>(undefined)

// --- Hooks ---
export function useXP() {
  const context = useContext(XPContext)
  if (!context) throw new Error("useXP must be used within XPProvider")
  return context
}

export function useAreaXP() {
  const context = useContext(AreaXPContext)
  if (!context) throw new Error("useAreaXP must be used within AreaXPProvider")
  return context
}

export function useAreaColors() {
  const context = useContext(AreaColorsContext)
  if (!context) throw new Error("useAreaColors must be used within AreaColorsProvider")
  return context
}

export function useAreaFilter() {
  const context = useContext(AreaFilterContext)
  if (!context) throw new Error("useAreaFilter must be used within AreaFilterProvider")
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

export function useAreas() {
  const context = useContext(AreasContext)
  if (!context) throw new Error("useAreas must be used within AreasProvider")
  return context
}

export function useSkillXP() {
  const { areaXPs, addAreaXP, removeAreaXP } = useAreaXP()
  return {
    skillXPs: areaXPs,
    addSkillXP: addAreaXP,
    removeSkillXP: removeAreaXP,
  }
}

export function useSkillColors() {
  const { areaColors, setAreaColor } = useAreaColors()
  return {
    skillColors: areaColors,
    setSkillColor: setAreaColor,
  }
}

export function useSkills() {
  const { areas, addArea, removeArea, hasAreas } = useAreas()
  return {
    skills: areas,
    addSkill: addArea,
    removeSkill: removeArea,
    hasSkills: hasAreas,
  }
}

export function useSkillFilter() {
  const { selectedAreas, toggleArea, clearAreas } = useAreaFilter()
  return {
    selectedSkill: selectedAreas.length === 1 ? selectedAreas[0] : null,
    setSelectedSkill: (skill: string | null) => {
      if (skill === null) clearAreas()
      else toggleArea(skill)
    },
  }
}

// --- Providers ---

export function XPProvider({ children }: { children: ReactNode }) {
  const [totalXP, setTotalXP] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [maxXP, setMaxXP] = useState(200)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function fetchFromDB() {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoaded(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("total_xp,current_level,max_xp")
        .eq("user_id", session.user.id)
        .single();
      if (data) {
        setTotalXP(data.total_xp || 0);
        setCurrentLevel(data.current_level || 1);
        setMaxXP(data.max_xp || 200);
      }
      setIsLoaded(true);
    }
    fetchFromDB();
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

export function AreaXPProvider({ children }: { children: ReactNode }) {
  const [areaXPs, setAreaXPs] = useState<Record<string, number>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function fetchAreaXPs() {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoaded(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("skill_xps")
        .eq("user_id", session.user.id)
        .single();
      if (data) setAreaXPs(data.skill_xps||{});
      setIsLoaded(true);
    }
    fetchAreaXPs();
  }, []);

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.skillXPs = areaXPs
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [areaXPs, isLoaded])

  const addAreaXP = (area: string, amount: number) => {
    setAreaXPs((prev) => ({
      ...prev,
      [area]: (prev[area] || 0) + amount,
    }))
  }

  const removeAreaXP = (area: string, amount: number) => {
    setAreaXPs((prev) => ({
      ...prev,
      [area]: Math.max(0, (prev[area] || 0) - amount),
    }))
  }

  return <AreaXPContext.Provider value={{ areaXPs, addAreaXP, removeAreaXP }}>{children}</AreaXPContext.Provider>
}

export function AreaColorsProvider({ children }: { children: ReactNode }) {
  const [areaColors, setAreaColors] = useState<Record<string, string>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function fetchAreaColors() {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoaded(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("skill_colors")
        .eq("user_id", session.user.id)
        .single();
      if (data) setAreaColors(data.skill_colors || {});
      setIsLoaded(true);
    }
    fetchAreaColors();
  }, []);

  useEffect(() => {
    if (!isLoaded) return
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      profile.skillColors = areaColors
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }, [areaColors, isLoaded])

  const setAreaColor = (area: string, color: string) => {
    setAreaColors((prev) => ({ ...prev, [area]: color }))
  }

  return <AreaColorsContext.Provider value={{ areaColors, setAreaColor }}>{children}</AreaColorsContext.Provider>
}

export function AreaFilterProvider({ children }: { children: ReactNode }) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }
  const clearAreas = () => setSelectedAreas([])
  return <AreaFilterContext.Provider value={{ selectedAreas, toggleArea, clearAreas }}>{children}</AreaFilterContext.Provider>
}

export function QuestsProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState({
    plans: [] as Quest[],
    dailies: [] as Quest[],
    habits: [] as Quest[],
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function fetchQuests() {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoaded(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("quests")
        .eq("user_id", session.user.id)
        .single();
      if (data && data.quests) setQuests(data.quests);
      setIsLoaded(true);
    }
    fetchQuests();
  }, []);

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
    async function fetchActivities() {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoaded(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("activities")
        .eq("user_id", session.user.id)
        .single();
      if (data) setActivities(data.activities || []);
      setIsLoaded(true);
    }
    fetchActivities();
  }, []);

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

export function AreasProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<string[]>([])
  const [archivedAreas, setArchivedAreas] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile & { archivedAreas?: string[] } = JSON.parse(storedProfile)
      const allAreaNames = Object.keys(profile.skillColors || {})
      const archived = profile.archivedAreas || []
      setArchivedAreas(archived)
      setAreas(allAreaNames.filter((n) => !archived.includes(n)))
    }
    setIsLoaded(true)
  }, [])

  const persistArchived = (nextArchived: string[]) => {
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: any = JSON.parse(storedProfile)
      profile.archivedAreas = nextArchived
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }
  }

  const addArea = (areaName: string, color: string) => {
    if (!areas.includes(areaName) && !archivedAreas.includes(areaName)) {
      setAreas((prev) => [...prev, areaName])
    }
  }

  const removeArea = (areaName: string) => {
    setAreas((prev) => prev.filter((s) => s !== areaName))
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile: UserProfile = JSON.parse(storedProfile)
      if (profile.skillColors) delete profile.skillColors[areaName]
      if (profile.skillXPs) delete profile.skillXPs[areaName]
      if (profile.quests) {
        profile.quests.plans = profile.quests.plans.filter((q) => q.skill !== areaName)
        profile.quests.dailies = profile.quests.dailies.filter((q) => q.skill !== areaName)
        profile.quests.habits = profile.quests.habits.filter((q) => q.skill !== areaName)
      }
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
      window.location.reload()
    }
  }

  const archiveArea = (areaName: string) => {
    if (!archivedAreas.includes(areaName)) {
      const nextArchived = [...archivedAreas, areaName]
      setArchivedAreas(nextArchived)
      setAreas((prev) => prev.filter((s) => s !== areaName))
      persistArchived(nextArchived)
    }
  }

  const unarchiveArea = (areaName: string) => {
    if (archivedAreas.includes(areaName)) {
      const nextArchived = archivedAreas.filter((s) => s !== areaName)
      setArchivedAreas(nextArchived)
      setAreas((prev) => (prev.includes(areaName) ? prev : [...prev, areaName]))
      persistArchived(nextArchived)
    }
  }

  const hasAreas = areas.length > 0
  return (
    <AreasContext.Provider
      value={{ areas, addArea, removeArea, hasAreas, archivedAreas, archiveArea, unarchiveArea }}
    >
      {children}
    </AreasContext.Provider>
  )
}
