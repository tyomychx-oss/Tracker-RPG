"use client"

import React, { useEffect, useState, ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  useXP,
  useQuests,
  useAreaXP,
  useAreaColors,
  useRecentActivity,
  useUIColor,
  useNickname,
  useSparks,
  useAreas,
} from "@/components/providers"
import { useShop } from "@/components/shop-provider"

interface SyncManagerProps {
  children: ReactNode
}

export function SyncManager({ children }: SyncManagerProps) {
  const [isDataReady, setIsDataReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setXPState } = useXP()
  const { setQuests, setTaskSnapshots } = useQuests()
  const { setAreaXPs } = useAreaXP()
  const { setAreaColors } = useAreaColors()
  const { setActivities } = useRecentActivity()
  const { setUIColor } = useUIColor()
  const { setNickname, nickname } = useNickname()
  const { setSparks } = useSparks()
  const { setAreas, setArchivedAreas } = useAreas()
  const { setRewards, setTransactions, setIsLoading: setShopLoading } = useShop()

  const supabase = createClient()

  // 1. INITIAL FETCH
  useEffect(() => {
    async function initApp() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          window.location.href = "/auth/sign-in"
          return
        }

        const userId = session.user.id

        // Parallel fetch for speed
        const [profileRes, rewardsRes, transactionsRes] = await Promise.all([
          supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
          supabase.from("shop_rewards").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
        ])

        if (profileRes.error) throw profileRes.error
        const profile = profileRes.data

        // Populate Contexts
        setNickname(profile.nickname || "")
        setXPState({
          totalXP: profile.total_xp || 0,
          currentLevel: profile.current_level || 1,
          maxXP: profile.max_xp || 200,
        })
        setAreaXPs(profile.skill_xps || {})
        setAreaColors(profile.skill_colors || {})
        setQuests(profile.quests || { plans: [], dailies: [], habits: [] })
        setActivities(profile.activities || [])
        setUIColor(profile.ui_color || "#de6550")
        setTaskSnapshots(profile.task_snapshots || {})
        setSparks(profile.sparks || 0)
        
        const archived = profile.archived_areas || []
        const allAreaNames = Object.keys(profile.skill_colors || {})
        setAreas(allAreaNames.filter(name => !archived.includes(name)))
        setArchivedAreas(archived)

        if (rewardsRes.data) setRewards(rewardsRes.data)
        if (transactionsRes.data) setTransactions(transactionsRes.data)
        setShopLoading(false)

        setIsDataReady(true)
      } catch (err: any) {
        console.error("Initial fetch failed:", err)
        setError(err.message || "Failed to load your data.")
      }
    }

    initApp()
  }, [])

  // 2. REALTIME SUBSCRIPTIONS
  useEffect(() => {
    if (!isDataReady || !nickname) return

    let userId: string | null = null

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      userId = session.user.id

      const channel = supabase
        .channel(`global-sync-${userId}`)
        // Listen to User Profile changes
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "user_profiles", filter: `user_id=eq.${userId}` },
          (payload) => {
            const newData = payload.new as any
            console.log("[Sync] Profile update received via Realtime")
            
            if (newData.total_xp !== undefined) {
              setXPState({
                totalXP: newData.total_xp,
                currentLevel: newData.current_level,
                maxXP: newData.max_xp
              })
            }
            if (newData.quests) setQuests(newData.quests)
            if (newData.task_snapshots) setTaskSnapshots(newData.task_snapshots)
            if (newData.skill_xps) setAreaXPs(newData.skill_xps)
            if (newData.skill_colors || newData.archived_areas !== undefined) {
              const updatedColors = newData.skill_colors || {}
              const updatedArchived = newData.archived_areas || []
              
              if (newData.skill_colors) setAreaColors(updatedColors)
              if (newData.archived_areas !== undefined) setArchivedAreas(updatedArchived)
              
              // Derive active areas from the full skill_colors keys minus archived ones
              // Note: This works best when Supabase returns the full row (default)
              if (newData.skill_colors) {
                const allNames = Object.keys(updatedColors)
                setAreas(allNames.filter(n => !updatedArchived.includes(n)))
              }
            }
            if (newData.activities) setActivities(newData.activities)
            if (newData.ui_color) setUIColor(newData.ui_color)
            if (newData.sparks !== undefined) setSparks(newData.sparks)
            if (newData.nickname) setNickname(newData.nickname)
          }
        )
        // Listen to Shop Rewards changes
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shop_rewards", filter: `user_id=eq.${userId}` },
          async () => {
            const { data } = await supabase.from("shop_rewards").select("*").eq("user_id", userId).order("created_at", { ascending: false })
            if (data) setRewards(data)
          }
        )
        // Listen to Transactions
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
          async () => {
            const { data } = await supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
            if (data) setTransactions(data)
          }
        )
        .subscribe()

      return channel
    }

    const channelPromise = setup()

    return () => {
      channelPromise.then(c => c?.unsubscribe())
    }
  }, [isDataReady, nickname])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-4">Sync Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md">
          Retry Connection
        </button>
      </div>
    )
  }

  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <div className="text-xl font-mono text-primary animate-pulse">CONNECTING TO SUPABASE...</div>
        <p className="text-muted-foreground text-sm">Please wait while we mirror your progress.</p>
      </div>
    )
  }

  return <>{children}</>
}
