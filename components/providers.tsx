"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { ShopProvider } from "@/components/shop-provider"

// --- Interfaces ---
export interface XPContextType {
  totalXP: number
  accumulatedXP: number
  currentLevel: number
  maxXP: number
  setXPState: React.Dispatch<React.SetStateAction<{ totalXP: number; currentLevel: number; maxXP: number }>>
  addXP: (amount: number) => void
  removeXP: (amount: number) => void
  resetXP: () => void
  restorePreviousState: (previousLevel: number, previousXP: number, previousMaxXP: number) => void
}

export interface AreaXPContextType {
  areaXPs: Record<string, number>
  setAreaXPs: React.Dispatch<React.SetStateAction<Record<string, number>>>
  addAreaXP: (area: string, amount: number) => void
  removeAreaXP: (area: string, amount: number) => void
  renameAreaXPKey: (oldName: string, newName: string) => void
}

export interface AreaColorsContextType {
  areaColors: Record<string, string>
  setAreaColors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setAreaColor: (area: string, color: string) => void
  renameAreaColorKey: (oldName: string, newName: string) => void
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
  frequency?: number
  frequencyCount?: number
  frequencyPeriodDays?: number
  resetTime?: string
  completedCount?: number
  lastResetDate?: string | null
  periodStartAt?: number
  streak?: number
  subtasks?: {
    id: string
    title: string
    completed: boolean
  }[]
  reward?: number
  pinned?: boolean
  pinnedOrder?: number
}

export interface QuestsContextType {
  taskSnapshots: Record<number, TaskStateSnapshot>
  setTaskSnapshots: React.Dispatch<React.SetStateAction<Record<number, TaskStateSnapshot>>>
  quests: {
    plans: Quest[]
    dailies: Quest[]
    habits: Quest[]
  }
  setQuests: React.Dispatch<React.SetStateAction<{ plans: Quest[]; dailies: Quest[]; habits: Quest[] }>>
  addQuest: (category: "plans" | "dailies" | "habits", quest: Quest) => void
  updateQuest: (category: "plans" | "dailies" | "habits", questId: number, updates: Partial<Quest>) => void
  deleteQuest: (category: "plans" | "dailies" | "habits", questId: number) => void
  deleteQuestsBySkill: (skill: string) => void
  resetQuests: () => void
}

export interface RecentActivityContextType {
  activities: Array<{ id: number; action: string; timestamp: number; xp?: number; sparks?: number; type?: "plans" | "dailies" | "habits" }>
  setActivities: React.Dispatch<React.SetStateAction<Array<{ id: number; action: string; timestamp: number; xp?: number; sparks?: number; type?: "plans" | "dailies" | "habits" }>>>
  addActivity: (action: string, xp?: number, type?: "plans" | "dailies" | "habits", sparks?: number) => void
  resetActivities: () => void
}

export interface UIColorContextType {
  uiColor: string
  setUIColor: (color: string) => void
}

export interface NicknameContextType {
  nickname: string
  setNickname: (name: string) => void
}

export interface SparksContextType {
  sparks: number
  setSparks: React.Dispatch<React.SetStateAction<number>>
  addSparks: (amount: number) => void
  removeSparks: (amount: number) => void
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
  sparks: number
  skillXPs: Record<string, number>
  skillColors: Record<string, string>
  quests: {
    plans: Quest[]
    dailies: Quest[]
    habits: Quest[]
  }
  activities: Array<{ id: number; action: string; timestamp: number; xp?: number; sparks?: number; type?: "plans" | "dailies" | "habits" }>
  uiColor: string
  taskSnapshots?: Record<number, TaskStateSnapshot>
  archivedSkills?: string[]
}

export interface AreasContextType {
  areas: string[]
  setAreas: React.Dispatch<React.SetStateAction<string[]>>
  addArea: (areaName: string, color: string) => void
  removeArea: (areaName: string) => void
  hasAreas: boolean
  archivedAreas: string[]
  setArchivedAreas: React.Dispatch<React.SetStateAction<string[]>>
  archiveArea: (areaName: string) => void
  unarchiveArea: (areaName: string) => void
  renameArea: (oldName: string, newName: string, newColor?: string) => void
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
const SparksContext = createContext<SparksContextType | undefined>(undefined)

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

export function useSparks() {
  const context = useContext(SparksContext)
  if (!context) throw new Error("useSparks must be used within SparksProvider")
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
  const [xpState, setXPState] = useState({
    totalXP: 0,
    currentLevel: 1,
    maxXP: 200,
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const hasUserMadeChanges = useRef(false)

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

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const accumulatedXP = calculateTotalXP(xpState.currentLevel, xpState.totalXP, xpState.maxXP)

  const addXP = (amount: number) => {
    hasUserMadeChanges.current = true
    setXPState((prev) => {
      const totalXPBefore = calculateTotalXP(prev.currentLevel, prev.totalXP, prev.maxXP)
      const totalXPAfter = totalXPBefore + amount
      const { level, currentXP, maxXP: newMaxXP } = calculateLevelFromTotalXP(totalXPAfter)
      return {
        currentLevel: level,
        totalXP: currentXP,
        maxXP: newMaxXP,
      }
    })
  }

  const removeXP = (amount: number) => {
    hasUserMadeChanges.current = true
    setXPState((prev) => {
      const totalXPBefore = calculateTotalXP(prev.currentLevel, prev.totalXP, prev.maxXP)
      const totalXPAfter = Math.max(0, totalXPBefore - amount)
      const { level, currentXP, maxXP: newMaxXP } = calculateLevelFromTotalXP(totalXPAfter)
      return {
        currentLevel: level,
        totalXP: currentXP,
        maxXP: newMaxXP,
      }
    })
  }

  const resetXP = () => {
    hasUserMadeChanges.current = true
    setXPState({
      totalXP: 0,
      currentLevel: 1,
      maxXP: 200,
    })
  }

  const restorePreviousState = (previousLevel: number, previousXP: number, previousMaxXP: number) => {
    hasUserMadeChanges.current = true
    setXPState({
      currentLevel: previousLevel,
      totalXP: previousXP,
      maxXP: previousMaxXP,
    })
  }

  return (
    <XPContext.Provider
      value={{
        totalXP: xpState.totalXP,
        accumulatedXP,
        currentLevel: xpState.currentLevel,
        maxXP: xpState.maxXP,
        setXPState,
        addXP,
        removeXP,
        resetXP,
        restorePreviousState,
      }}
    >
      {children}
    </XPContext.Provider>
  )
}

export function AreaXPProvider({ children }: { children: ReactNode }) {
  const [areaXPs, setAreaXPs] = useState<Record<string, number>>({})

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

  const renameAreaXPKey = (oldName: string, newName: string) => {
    setAreaXPs((prev) => {
      if (!(oldName in prev)) return prev
      const next = { ...prev }
      next[newName] = prev[oldName]
      delete next[oldName]
      return next
    })
  }

  return <AreaXPContext.Provider value={{ areaXPs, setAreaXPs, addAreaXP, removeAreaXP, renameAreaXPKey }}>{children}</AreaXPContext.Provider>
}

export function AreaColorsProvider({ children }: { children: ReactNode }) {
  const [areaColors, setAreaColors] = useState<Record<string, string>>({})

  const setAreaColor = (area: string, color: string) => {
    setAreaColors((prev) => ({ ...prev, [area]: color }))
  }

  const renameAreaColorKey = (oldName: string, newName: string) => {
    setAreaColors((prev) => {
      if (!(oldName in prev)) return prev
      const next = { ...prev }
      next[newName] = prev[oldName]
      delete next[oldName]
      return next
    })
  }

  return <AreaColorsContext.Provider value={{ areaColors, setAreaColors, setAreaColor, renameAreaColorKey }}>{children}</AreaColorsContext.Provider>
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
  const [taskSnapshots, setTaskSnapshots] = useState<Record<number, TaskStateSnapshot>>({})

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

  const deleteQuestsBySkill = (skill: string) => {
    setQuests((prev) => ({
      plans: prev.plans.filter((q) => q.skill !== skill),
      dailies: prev.dailies.filter((q) => q.skill !== skill),
      habits: prev.habits.filter((q) => q.skill !== skill),
    }))
  }

  const resetQuests = () => {
    setQuests((prev) => ({
      plans: prev.plans.map(q => ({ ...q, completed: false, lastCompletedDate: null })),
      dailies: prev.dailies.map(q => ({ ...q, completed: false, lastCompletedDate: null })),
      habits: prev.habits.map(q => ({ ...q, completed: false, lastCompletedDate: null })),
    }))
  }

  return (
    <QuestsContext.Provider value={{ quests, taskSnapshots, setTaskSnapshots, setQuests, addQuest, updateQuest, deleteQuest, deleteQuestsBySkill, resetQuests }}>{children}</QuestsContext.Provider>
  )
}

export function RecentActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Array<{ id: number; action: string; timestamp: number; xp?: number; sparks?: number; type?: "plans" | "dailies" | "habits" }>>([])

  const addActivity = (action: string, xp?: number, type?: "plans" | "dailies" | "habits", sparks?: number) => {
    setActivities((prev) => [{ id: Date.now(), action, timestamp: Date.now(), xp, sparks, type }, ...prev.slice(0, 999)])
  }

  const resetActivities = () => {
    setActivities([])
  }

  return <RecentActivityContext.Provider value={{ activities, setActivities, addActivity, resetActivities }}>{children}</RecentActivityContext.Provider>
}

export function UIColorProvider({ children }: { children: ReactNode }) {
  const [uiColor, setUIColor] = useState("#de6550")

  return <UIColorContext.Provider value={{ uiColor, setUIColor }}>{children}</UIColorContext.Provider>
}

export function SparksProvider({ children }: { children: ReactNode }) {
  const [sparks, setSparks] = useState(0)

  const addSparks = (amount: number) => {
    setSparks((prev) => prev + amount)
  }

  const removeSparks = (amount: number) => {
    setSparks((prev) => Math.max(0, prev - amount))
  }

  return (
    <SparksContext.Provider value={{ sparks, setSparks, addSparks, removeSparks }}>
      <ShopProvider>
        {children}
      </ShopProvider>
    </SparksContext.Provider>
  )
}

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState("")

  return <NicknameContext.Provider value={{ nickname, setNickname }}>{children}</NicknameContext.Provider>
}

export function AreasProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<string[]>([])
  const [archivedAreas, setArchivedAreas] = useState<string[]>([])

  const addArea = (areaName: string, color: string) => {
    if (!areas.includes(areaName) && !archivedAreas.includes(areaName)) {
      setAreas((prev) => [...prev, areaName])
    }
  }

  const removeArea = (areaName: string) => {
    setAreas((prev) => prev.filter((s) => s !== areaName))
  }

  const archiveArea = (areaName: string) => {
    if (!archivedAreas.includes(areaName)) {
      setArchivedAreas((prev) => [...prev, areaName])
      setAreas((prev) => prev.filter((s) => s !== areaName))
    }
  }

  const unarchiveArea = (areaName: string) => {
    if (archivedAreas.includes(areaName)) {
      setArchivedAreas((prev) => prev.filter((s) => s !== areaName))
      setAreas((prev) => (prev.includes(areaName) ? prev : [...prev, areaName]))
    }
  }

  const renameArea = (oldName: string, newName: string) => {
    const nextName = newName.trim()
    if (!nextName || nextName === oldName) return
    setAreas((prev) => prev.map((s) => (s === oldName ? nextName : s)))
    setArchivedAreas((prev) => prev.map((s) => (s === oldName ? nextName : s)))
  }

  return (
    <AreasContext.Provider
      value={{ areas, setAreas, addArea, removeArea, hasAreas: areas.length > 0, archivedAreas, setArchivedAreas, archiveArea, unarchiveArea, renameArea }}
    >
      {children}
    </AreasContext.Provider>
  )
}
