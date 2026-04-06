"use client"

import { useEffect, useRef, useState } from "react"
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
  useAreas
} from "@/components/providers"
import { useShop } from "@/components/shop-provider"

export function DatabaseSync() {
  const { totalXP, currentLevel, maxXP, setXPState } = useXP()
  const { quests, taskSnapshots, setQuests, setTaskSnapshots } = useQuests()
  const { areaXPs, setAreaXPs } = useAreaXP()
  const { areaColors, setAreaColors } = useAreaColors()
  const { activities, setActivities } = useRecentActivity()
  const { uiColor, setUIColor } = useUIColor()
  const { nickname, setNickname } = useNickname()
  const { sparks, setSparks } = useSparks()
  const { setAreas, setArchivedAreas } = useAreas()
  const { setRewards, setTransactions } = useShop()

  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved")
  const [mounted, setMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Flag to ensure we don't sync until the first load from Supabase is complete
  const hasInitialLoadCompleted = useRef(false)
  
  // Ref to store the last version of data received from the server
  // to prevent syncing back the exact same data we just received
  const lastServerDataRef = useRef<string | null>(null)

  // Fix hydration: only render after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Realtime Subscriptions
  useEffect(() => {
    if (!mounted || !nickname) return

    const supabase = createClient()
    let userId: string | null = null

    const setupSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      userId = session.user.id

      // Listen to user_profiles updates
      const profileChannel = supabase
        .channel(`profile-sync-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_profiles",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newData = payload.new as any
            
            // Prepare comparison (simplified object without database metadata)
            const simplifiedNew = {
              nickname: newData.nickname,
              total_xp: newData.total_xp,
              current_level: newData.current_level,
              max_xp: newData.max_xp,
              quests: newData.quests,
              task_snapshots: newData.task_snapshots,
              skill_xps: newData.skill_xps,
              skill_colors: newData.skill_colors,
              activities: newData.activities,
              ui_color: newData.ui_color,
              sparks: newData.sparks,
              archived_areas: newData.archived_areas
            }
            const dataString = JSON.stringify(simplifiedNew)
            
            // Skip if this is the change we just sent
            if (dataString === lastServerDataRef.current) return
            lastServerDataRef.current = dataString

            console.log("[Realtime] Profile update received:", newData.nickname)

            // Update all local states
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
              // Also update AreasProvider if areas changed
              const allAreaNames = Object.keys(newData.skill_colors)
              const archived = newData.archived_areas || []
              setAreas(allAreaNames.filter(n => !archived.includes(n)))
              setArchivedAreas(archived)
            }
            if (newData.activities) setActivities(newData.activities)
            if (newData.ui_color) setUIColor(newData.ui_color)
            if (newData.sparks !== undefined) setSparks(newData.sparks)
            if (newData.nickname) setNickname(newData.nickname)
            
            // Ensure flag is set if we get data
            hasInitialLoadCompleted.current = true
          }
        )
        .subscribe()

      // Listen to shop rewards
      const rewardsChannel = supabase
        .channel(`rewards-sync-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shop_rewards",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            console.log("[Realtime] Shop rewards changed, refetching...")
            const { data } = await supabase
              .from("shop_rewards")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
            if (data) setRewards(data)
          }
        )
        .subscribe()

      // Listen to transactions
      const transactionsChannel = supabase
        .channel(`transactions-sync-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
             console.log("[Realtime] New transaction, refetching...")
             const { data } = await supabase
              .from("transactions")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(50)
            if (data) setTransactions(data)
          }
        )
        .subscribe()

      return () => {
        profileChannel.unsubscribe()
        rewardsChannel.unsubscribe()
        transactionsChannel.unsubscribe()
      }
    }

    const cleanupFnPromise = setupSubscriptions()

    return () => {
      cleanupFnPromise.then(cleanup => cleanup?.())
    }
  }, [mounted, nickname])

  // 2. Outgoing Sync Logic (Debounced)
  useEffect(() => {
    if (!nickname || !mounted) return

    // CRITICAL: Block sync until initial fetch is complete
    if (!hasInitialLoadCompleted.current) {
        // If nickname is set, it means app/page.tsx finished fetching
        hasInitialLoadCompleted.current = true
        return 
    }

    const currentState = {
      nickname,
      total_xp: totalXP,
      current_level: currentLevel,
      max_xp: maxXP,
      quests,
      task_snapshots: taskSnapshots,
      skill_xps: areaXPs,
      skill_colors: areaColors,
      activities,
      ui_color: uiColor,
      sparks,
      archived_areas: [] // Handled in a more complex way if needed, for now empty or derived
    }

    const currentStateString = JSON.stringify(currentState)
    
    // Skip if current local state matches what we last received from server
    if (currentStateString === lastServerDataRef.current) {
      return
    }

    setStatus("saving")

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const payload = {
          user_id: session.user.id,
          nickname,
          total_xp: totalXP,
          current_level: currentLevel,
          max_xp: maxXP,
          quests,
          task_snapshots: taskSnapshots,
          skill_xps: areaXPs,
          skill_colors: areaColors,
          activities,
          ui_color: uiColor,
          sparks,
          // archived_areas: archivedAreas, // We should probably get this from the state too
          updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .upsert(payload, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error("Sync error:", error.message || "Unknown error")
        setStatus("error")
      } else {
        // Update the ref so we don't trigger on our own change
        if (data) {
           const simplified = {
              nickname: data.nickname,
              total_xp: data.total_xp,
              current_level: data.current_level,
              max_xp: data.max_xp,
              quests: data.quests,
              task_snapshots: data.task_snapshots,
              skill_xps: data.skill_xps,
              skill_colors: data.skill_colors,
              activities: data.activities,
              ui_color: data.ui_color,
              sparks: data.sparks,
              archived_areas: data.archived_areas || []
            }
          lastServerDataRef.current = JSON.stringify(simplified)
        }
        setStatus("saved")
      }
    }, 2000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [totalXP, currentLevel, maxXP, quests, taskSnapshots, areaXPs, areaColors, activities, uiColor, nickname, sparks, mounted])

  if (!mounted) return null

  return (
    <div className="fixed bottom-2 right-2 text-xs opacity-50 font-mono pointer-events-none z-50">
      {status === "saving" && "☁️ Saving..."}
      {status === "saved" && "✓ Synced"}
      {status === "error" && "⚠️ Sync Error"}
    </div>
  )
}
