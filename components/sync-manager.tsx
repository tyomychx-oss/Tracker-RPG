"use client"

import React, { useEffect, useState, ReactNode, useRef } from "react"
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
import { updateQuests, getQuestsTable, updateQuestsTable } from "@/lib/supabase-actions"
import { checkAndResetDailies } from "@/utils/daily-reset"

interface SyncManagerProps {
  children: ReactNode
}

export function SyncManager({ children }: SyncManagerProps) {
  const [isDataReady, setIsDataReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [userIdState, setUserIdState] = useState<string | null>(null)

  const { setXPState } = useXP()
  const { setQuests, setTaskSnapshots, lastUpdated } = useQuests()
  const lastUpdateRef = useRef(lastUpdated)
  
  // Keep ref in sync
  useEffect(() => {
    lastUpdateRef.current = lastUpdated
  }, [lastUpdated])

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
        console.log("[Sync] Starting initial fetch...")
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error("[Sync] Auth error:", authError)
          throw authError
        }

        if (!session) {
          console.log("[Sync] No session found, entering passive mode.")
          setIsDataReady(true)
          return
        }

        const currentUserId = session.user.id
        setUserIdState(currentUserId)
        console.log("[Sync] Authenticated as:", currentUserId)

        // Parallel fetch for speed with CACHE BYPASS
        const [profileRes, rewardsRes, transactionsRes] = await Promise.all([
          // FIX: maybeSingle() to handle missing profiles gracefully
          supabase.from("user_profiles").select("*").eq("user_id", currentUserId).maybeSingle(),
          supabase.from("shop_rewards").select("*").eq("user_id", currentUserId).order("created_at", { ascending: false }),
          supabase.from("transactions").select("*").eq("user_id", currentUserId).order("created_at", { ascending: false }).limit(50)
        ])

        if (profileRes.error) {
          console.error("[Sync] Profile fetch failed:", profileRes.error)
          throw profileRes.error
        }
        
        const profile = profileRes.data
        
        if (!profile) {
          console.warn("[Sync] User profile not found (pending onboarding).")
          setIsDataReady(true)
          return
        }

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
        
        // --- QUESTS FETCH & MERGE ---
        const profileQuests = profile.quests || { plans: [], dailies: [], habits: [] }
        // Fetch Dailies from dedicated SQL table
        const tableQuests = await getQuestsTable(currentUserId)
        const sqlDailies = tableQuests.filter((q: any) => q.category === 'dailies')
        
        // Merge: Dailies from SQL, Plans/Habits from JSON
        const fetchedQuests = { 
          ...profileQuests, 
          dailies: sqlDailies 
        }
        setQuests(fetchedQuests)

        // 2. DAILY RESET ENGINE
        console.log("[Daily Engine] Check started")
        const { updatedQuests, resetCount } = checkAndResetDailies(fetchedQuests)
        
        if (resetCount > 0) {
          console.log(`[Daily Engine] Reset ${resetCount} tasks based on frequency/time settings.`)
          // Update SQL Table for Dailies
          const dailiesToSync = updatedQuests.dailies.filter((q: any) => {
            const original = fetchedQuests.dailies.find((od: any) => od.id === q.id)
            return JSON.stringify(q) !== JSON.stringify(original)
          })
          if (dailiesToSync.length > 0) {
            await updateQuestsTable(dailiesToSync)
          }
          setQuests(updatedQuests)
        } else if (JSON.stringify(updatedQuests) !== JSON.stringify(fetchedQuests)) {
          // Sync initialization (e.g. stale completions)
          const dailiesToSync = updatedQuests.dailies.filter((q: any) => {
            const original = fetchedQuests.dailies.find((od: any) => od.id === q.id)
            return JSON.stringify(q) !== JSON.stringify(original)
          })
          if (dailiesToSync.length > 0) {
            await updateQuestsTable(dailiesToSync)
          }
          setQuests(updatedQuests)
        }
        setActivities(profile.activities || [])
        setUIColor(profile.ui_color || "#de6550")
        setTaskSnapshots(profile.task_snapshots || {})
        setSparks(profile.sparks || 0)
        
        const archived = profile.archived_areas || []
        const allAreaNames = Object.keys(profile.skill_colors || {})
        const activeAreas = allAreaNames.filter(name => !archived.includes(name))
        
        setAreas(activeAreas)
        setArchivedAreas(archived)

        if (rewardsRes.data) setRewards(rewardsRes.data)
        if (transactionsRes.data) setTransactions(transactionsRes.data)
        setShopLoading(false)

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
    // Only subscribe if we have data AND a userId
    if (!isDataReady || !userIdState) return

    const channel = supabase
      .channel(`global-sync-${userIdState}`)
      // Listen to User Profile changes
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_profiles", filter: `user_id=eq.${userIdState}` },
        (payload) => {
          const newData = payload.new as any
          console.log("[Sync] Profile update received via Realtime")

          // PROTECT AGAINST REVERTS:
          // If we recently performed a local update, ignore Realtime for a short window
          const now = Date.now()
          if (now - lastUpdateRef.current < 3000) {
            console.log("[Sync] Skipping Realtime update (Too recent after local action)")
            return
          }

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
            
            const allNames = Object.keys(updatedColors)
            const activeAreas = allNames.filter(n => !updatedArchived.includes(n))
            
            if (newData.skill_colors) {
              setAreas(activeAreas)
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
        { event: "*", schema: "public", table: "shop_rewards", filter: `user_id=eq.${userIdState}` },
        async () => {
          const { data } = await supabase.from("shop_rewards").select("*").eq("user_id", userIdState).order("created_at", { ascending: false })
          if (data) setRewards(data)
        }
      )
      // Listen to Transactions
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${userIdState}` },
        async () => {
          const { data } = await supabase.from("transactions").select("*").eq("user_id", userIdState).order("created_at", { ascending: false }).limit(50)
          if (data) setTransactions(data)
        }
      )
      // Listen to Dedicated Quests Table (Dailies)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quests", filter: `user_id=eq.${userIdState}` },
        async () => {
          console.log("[Sync] Quests table update received via Realtime")
          const tableQuests = await getQuestsTable(userIdState)
          const sqlDailies = tableQuests.filter((q: any) => q.category === 'dailies')
          
          setQuests(prev => ({
            ...prev,
            dailies: sqlDailies
          }))
        }
      )

    channel.subscribe((status) => {
      console.log(`[Sync] Realtime status change: ${status}`)
      if (status === "SUBSCRIBED") {
        setRealtimeStatus("connected")
      } else if (status === "TIMED_OUT") {
        setRealtimeStatus("connecting")
      } else {
        setRealtimeStatus("disconnected")
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [isDataReady, userIdState])

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

  // Only show the screen when we ARE logged in but data is not yet synchronized
  // (Don't show on login page when userIdState is null)
  if (!isDataReady && userIdState) {
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
      <DebugPanel userId={userIdState} realtimeStatus={realtimeStatus} />
      {children}
    </>
  )
}
