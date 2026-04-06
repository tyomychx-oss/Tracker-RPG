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
import { DebugPanel } from "@/components/debug-panel"

interface SyncManagerProps {
  children: ReactNode
}

export function SyncManager({ children }: SyncManagerProps) {
  const [isDataReady, setIsDataReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [userId, setUserId] = useState<string | null>(null)

  const { setXPState } = useXP()
  const { setQuests, setTaskSnapshots } = useQuests()
  const { setAreaXPs } = useAreaXP()
  const { setAreaColors } = useAreaColors()
  const { setActivities } = useRecentActivity()
  const { setUIColor } = useUIColor()
  const { setNickname, nickname } = useNickname()
  const { setSparks } = useSparks()
  const { setAreas, setArchivedAreas } = useAreas()
  const { setRewards, setTransactions } = useShop()

  const supabase = createClient()

  // 1. INITIAL FETCH
  useEffect(() => {
    async function initApp() {
      try {
        console.log("[Sync] Starting initial fetch...")
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error("[Sync] Auth error:", authError)
          throw authError
        }

        if (!session) {
          console.warn("[Sync] No session found, redirecting...")
          window.location.href = "/auth/sign-in"
          return
        }

        const currentUserId = session.user.id
        setUserId(currentUserId)
        console.log("[Sync] Authenticated as:", currentUserId)

        // Parallel fetch for speed with CACHE BYPASS
        const [profileRes, rewardsRes, transactionsRes] = await Promise.all([
          supabase.from("user_profiles").select("*", { count: "exact" }).eq("user_id", currentUserId).single(),
          supabase.from("shop_rewards").select("*", { count: "exact" }).eq("user_id", currentUserId).order("created_at", { ascending: false }),
          supabase.from("transactions").select("*", { count: "exact" }).eq("user_id", currentUserId).order("created_at", { ascending: false }).limit(50)
        ])

        if (profileRes.error) {
          console.error("[Sync] Profile fetch failed:", profileRes.error)
          throw profileRes.error
        }
        
        const profile = profileRes.data
        console.log("[Sync] Data fetched successfully:", { profile: !!profile, rewards: rewardsRes.data?.length, txs: transactionsRes.data?.length })

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

        setIsDataReady(true)
      } catch (err: any) {
        console.error("[Sync] CRITICAL: Initial fetch failed:", err)
        setError(err.message || "Failed to load your data.")
      }
    }

    initApp()
  }, [])

  // 2. REALTIME SUBSCRIPTIONS
  useEffect(() => {
    if (!isDataReady || !nickname || !userId) {
      if (isDataReady && !nickname) {
         // Probably newcomer - wait for onboarding
         setRealtimeStatus("connected")
      }
      return
    }

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
          if (newData.skill_colors) {
            setAreaColors(newData.skill_colors)
            const archived = newData.archived_areas || []
            const allAreaNames = Object.keys(newData.skill_colors)
            setAreas(allAreaNames.filter(n => !archived.includes(n)))
            setArchivedAreas(archived)
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
          const { data } = await supabase.from("shop_rewards").select("*", { count: "exact" }).eq("user_id", userId).order("created_at", { ascending: false })
          if (data) setRewards(data)
        }
      )
      // Listen to Transactions
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase.from("transactions").select("*", { count: "exact" }).eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
          if (data) setTransactions(data)
        }
      )

    channel.subscribe((status) => {
      console.log(`[Sync] Realtime status change: ${status}`)
      if (status === "SUBSCRIBED") {
        setRealtimeStatus("connected")
      } else if (status === "RETRYING") {
        setRealtimeStatus("connecting")
      } else {
        setRealtimeStatus("disconnected")
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [isDataReady, nickname, userId])

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

  if (!isDataReady && nickname) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <div className="text-xl font-mono text-primary animate-pulse">MIRRORING DATA...</div>
        <p className="text-muted-foreground text-sm">Synchronizing your RPG state across devices.</p>
      </div>
    )
  }

  return (
    <>
      <DebugPanel userId={userId} realtimeStatus={realtimeStatus} />
      {children}
    </>
  )
}
