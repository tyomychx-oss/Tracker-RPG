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
  useSparks
} from "@/components/providers"

export function DatabaseSync() {
  const { totalXP, currentLevel, maxXP } = useXP()
  const { quests } = useQuests()
  const { areaXPs } = useAreaXP()
  const { areaColors } = useAreaColors()
  const { activities } = useRecentActivity()
  const { uiColor } = useUIColor()
  const { nickname } = useNickname()
  const { sparks } = useSparks()

  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved")
  const [mounted, setMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fix hydration: only render after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Якщо нікнейму немає, значить юзер ще не завантажився або не залогінений
    if (!nickname) return

    setStatus("saving")

    // Debounce: чекаємо 2 секунди після останньої зміни, щоб не спамити базу
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: session.user.id,
          nickname,
          total_xp: totalXP,
          current_level: currentLevel,
          max_xp: maxXP,
          quests,
          skill_xps: areaXPs,
          skill_colors: areaColors,
          activities,
          ui_color: uiColor,
          sparks,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error("Sync error:", error.message || "Unknown error")
        console.error("Error details:", {
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        setStatus("error")
      } else {
        setStatus("saved")
      }
    }, 2000) // Зберігаємо через 2 сек після зупинки дій

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [totalXP, currentLevel, maxXP, quests, areaXPs, areaColors, activities, uiColor, nickname, sparks])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return null

  // Маленький індикатор в кутку екрану
  return (
    <div className="fixed bottom-2 right-2 text-xs opacity-50 font-mono pointer-events-none z-50">
      {status === "saving" && "☁️ Saving..."}
      {status === "saved" && "✓ Synced"}
      {status === "error" && "⚠️ Sync Error"}
    </div>
  )
}
