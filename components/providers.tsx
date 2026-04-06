"use client"

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"
import { ShopProvider } from "@/components/shop-provider"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

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
}

export interface AreaXPContextType {
  areaXPs: Record<string, number>
  setAreaXPs: React.Dispatch<React.SetStateAction<Record<string, number>>>
  addAreaXP: (area: string, amount: number) => void
  removeAreaXP: (area: string, amount: number) => void
  removeSkillXP: (area: string, amount: number) => void
}

export interface AreaColorsContextType {
  areaColors: Record<string, string>
  setAreaColors: React.Dispatch<React.SetStateAction<Record<string, string>>>
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

export interface TaskStateSnapshot {
  questId: number
  previousLevel: number
  previousXP: number
  previousMaxXP: number
  previousSkillXP: number
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
  archivedAreas?: string[]
}

export interface AreasContextType {
  areas: string[]
  setAreas: React.Dispatch<React.SetStateAction<string[]>>
  archivedAreas: string[]
  setArchivedAreas: React.Dispatch<React.SetStateAction<string[]>>
  addArea: (name: string, color: string) => Promise<void>
  removeArea: (name: string) => Promise<void>
  archiveArea: (name: string) => Promise<void>
  unarchiveArea: (name: string) => Promise<void>
  renameArea: (oldName: string, newName: string, color: string) => Promise<void>
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
  const { areaXPs, removeSkillXP } = useAreaXP()
  return {
    skillXPs: areaXPs,
    removeSkillXP,
  }
}

export function useSkillColors() {
  const { areaColors } = useAreaColors()
  return {
    skillColors: areaColors,
  }
}

export function useSkills() {
  const { areas } = useAreas()
  return {
    skills: areas,
    hasSkills: areas.length > 0,
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

  const accumulatedXP = calculateTotalXP(xpState.currentLevel, xpState.totalXP, xpState.maxXP)

  return (
    <XPContext.Provider
      value={{
        totalXP: xpState.totalXP,
        accumulatedXP,
        currentLevel: xpState.currentLevel,
        maxXP: xpState.maxXP,
        setXPState,
        addXP: () => { }, // Dummy to satisfy types, actual logic moved to actions
        removeXP: () => { },
        resetXP: () => { },
      }}
    >
      {children}
    </XPContext.Provider>
  )
}

export function AreaXPProvider({ children }: { children: ReactNode }) {
  const [areaXPs, setAreaXPs] = useState<Record<string, number>>({})
  return <AreaXPContext.Provider value={{
    areaXPs,
    setAreaXPs,
    addAreaXP: () => { },
    removeAreaXP: () => { },
    removeSkillXP: () => { }
  }}>{children}</AreaXPContext.Provider>
}

export function AreaColorsProvider({ children }: { children: ReactNode }) {
  const [areaColors, setAreaColors] = useState<Record<string, string>>({})
  return <AreaColorsContext.Provider value={{ areaColors, setAreaColors }}>{children}</AreaColorsContext.Provider>
}

export function AreaFilterProvider({ children }: { children: ReactNode }) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const toggleArea = (area: string) => {
    setSelectedAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area])
  }
  const clearAreas = () => setSelectedAreas([])
  return <AreaFilterContext.Provider value={{ selectedAreas, toggleArea, clearAreas }}>{children}</AreaFilterContext.Provider>
}

export function QuestsProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState({ plans: [] as Quest[], dailies: [] as Quest[], habits: [] as Quest[] })
  const [taskSnapshots, setTaskSnapshots] = useState<Record<number, TaskStateSnapshot>>({})

  return (
    <QuestsContext.Provider value={{
      quests,
      taskSnapshots,
      setTaskSnapshots,
      setQuests,
      addQuest: () => { },
      updateQuest: () => { },
      resetQuests: () => { }
    }}>{children}</QuestsContext.Provider>
  )
}

export function RecentActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Array<{ id: number; action: string; timestamp: number; xp?: number; sparks?: number; type?: "plans" | "dailies" | "habits" }>>([])
  return <RecentActivityContext.Provider value={{
    activities,
    setActivities,
    addActivity: () => { },
    resetActivities: () => { }
  }}>{children}</RecentActivityContext.Provider>
}

export function UIColorProvider({ children }: { children: ReactNode }) {
  const [uiColor, setUIColor] = useState("#de6550")
  return <UIColorContext.Provider value={{ uiColor, setUIColor }}>{children}</UIColorContext.Provider>
}

export function SparksProvider({ children }: { children: ReactNode }) {
  const [sparks, setSparks] = useState(0)
  return (
    <SparksContext.Provider value={{ sparks, setSparks }}>
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

  const addArea = async (name: string, color: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const newAreas = [...areas, name]
    const { error } = await supabase
      .from("user_profiles")
      .update({ skill_colors: { [name]: color } }) // Simple overwrite for now, ideally needs a merge
      .eq("user_id", session.user.id)
    if (!error) setAreas(newAreas)
  }

  const removeArea = async (name: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const newAreas = areas.filter(a => a !== name)
    const { error } = await supabase
      .from("user_profiles")
      .update({ archived_areas: archivedAreas.filter(a => a !== name) })
      .eq("user_id", session.user.id)
    if (!error) setAreas(newAreas)
  }

  const archiveArea = async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const newAreas = areas.filter(a => a !== name)
      const newArchived = [...archivedAreas, name]
      const { error } = await supabase
        .from("user_profiles")
        .update({ archived_areas: newArchived })
        .eq("user_id", session.user.id)
      if (!error) {
          setAreas(newAreas)
          setArchivedAreas(newArchived)
      }
  }

  const unarchiveArea = async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const newArchived = archivedAreas.filter(a => a !== name)
      const newAreas = [...areas, name]
      const { error } = await supabase
        .from("user_profiles")
        .update({ archived_areas: newArchived })
        .eq("user_id", session.user.id)
      if (!error) {
          setAreas(newAreas)
          setArchivedAreas(newArchived)
      }
  }

  const renameArea = async (oldName: string, newName: string, color: string) => {
      // surface implementation for UI consistency
  }

  return (
    <AreasContext.Provider value={{ 
        areas, setAreas, archivedAreas, setArchivedAreas, 
        addArea, removeArea, archiveArea, unarchiveArea, renameArea 
    }}>
      {children}
    </AreasContext.Provider>
  )
}
