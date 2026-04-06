import { createClient } from "@/utils/supabase/client"
import { type UserProfile, type Quest, type TaskStateSnapshot } from "@/components/providers"

const supabase = createClient()

/**
 * Updates the entire user profile row.
 * Returns the updates upon success.
 */
export async function updateProfile(updates: Partial<UserProfile>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const dbPayload: any = { ...updates }
  if (updates.totalXP !== undefined) dbPayload.total_xp = updates.totalXP
  if (updates.currentLevel !== undefined) dbPayload.current_level = updates.currentLevel
  if (updates.maxXP !== undefined) dbPayload.max_xp = updates.maxXP
  if (updates.skillXPs !== undefined) dbPayload.skill_xps = updates.skillXPs
  if (updates.skillColors !== undefined) dbPayload.skill_colors = updates.skillColors
  if (updates.uiColor !== undefined) dbPayload.ui_color = updates.uiColor
  if (updates.taskSnapshots !== undefined) dbPayload.task_snapshots = updates.taskSnapshots
  if (updates.archivedAreas !== undefined) dbPayload.archived_areas = updates.archivedAreas

  const { error } = await supabase
    .from("user_profiles")
    .update(dbPayload)
    .eq("user_id", session.user.id)

  if (error) {
    console.error("Failed to update profile:", error)
    throw error
  }
  
  return updates
}

/**
 * Specifically updates the quests JSON object in the user profile.
 */
export async function updateQuests(quests: UserProfile["quests"]) {
  return updateProfile({ quests })
}

/**
 * Adds an activity record.
 */
export async function recordActivity(activity: UserProfile["activities"][number]) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("activities")
    .eq("user_id", session.user.id)
    .single()

  const currentActivities = profile?.activities || []
  const updatedActivities = [activity, ...currentActivities.slice(0, 999)]

  return updateProfile({ activities: updatedActivities })
}

/**
 * High-level helper for quest completion logic.
 * Updates local state and returns the data for immediate UI sync.
 */
export async function syncQuestCompletion({
  category,
  questId,
  isCompleted,
  xpChange,
  sparkChange,
  skillName,
  newQuestData,
  newActivities,
  newSnapshots,
  xpState
}: {
  category: "plans" | "dailies" | "habits"
  questId: number
  isCompleted: boolean
  xpChange: number
  sparkChange: number
  skillName: string
  newQuestData: UserProfile["quests"]
  newActivities: UserProfile["activities"]
  newSnapshots: Record<number, TaskStateSnapshot>
  xpState: { totalXP: number, currentLevel: number, maxXP: number }
}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("skill_xps, sparks")
    .eq("user_id", session.user.id)
    .single()

  const skillXPs = profile?.skill_xps || {}
  if (skillName && skillName !== "none") {
      skillXPs[skillName] = Math.max(0, (skillXPs[skillName] || 0) + xpChange)
  }

  const newSparks = Math.max(0, (profile?.sparks || 0) + sparkChange)

  const payload: any = {
    quests: newQuestData,
    activities: newActivities,
    task_snapshots: newSnapshots,
    total_xp: xpState.totalXP,
    current_level: xpState.currentLevel,
    max_xp: xpState.maxXP,
    skill_xps: skillXPs,
    sparks: newSparks
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(payload)
    .eq("user_id", session.user.id)

  if (error) throw error

  return {
    quests: newQuestData,
    activities: newActivities,
    taskSnapshots: newSnapshots,
    xpState,
    skillXPs,
    sparks: newSparks
  }
}
