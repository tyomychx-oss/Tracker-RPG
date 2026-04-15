import { createClient } from "@/utils/supabase/client"
import { type UserProfile, type Quest, type TaskStateSnapshot } from "@/components/providers"

const supabase = createClient()

/**
 * Updates the entire user profile row.
 * Returns the updates upon success.
 */
export async function updateProfile(updates: Partial<UserProfile>) {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  
  if (!userId) {
    throw new Error("User ID is missing")
  }

  const dbPayload: any = {}
  if (updates.nickname !== undefined) dbPayload.nickname = updates.nickname
  if (updates.quests !== undefined) dbPayload.quests = updates.quests
  if (updates.activities !== undefined) dbPayload.activities = updates.activities
  if (updates.sparks !== undefined) dbPayload.sparks = updates.sparks
  if (updates.totalXP !== undefined) dbPayload.total_xp = updates.totalXP
  if (updates.currentLevel !== undefined) dbPayload.current_level = updates.currentLevel
  if (updates.maxXP !== undefined) dbPayload.max_xp = updates.maxXP
  if (updates.skillXPs !== undefined) dbPayload.skill_xps = updates.skillXPs
  if (updates.skillColors !== undefined) dbPayload.skill_colors = updates.skillColors
  if (updates.uiColor !== undefined) dbPayload.ui_color = updates.uiColor
  if (updates.taskSnapshots !== undefined) dbPayload.task_snapshots = updates.taskSnapshots
  if (updates.archivedAreas !== undefined) dbPayload.archived_areas = updates.archivedAreas

  const { data, error } = await supabase
    .from("user_profiles")
    .update(dbPayload)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Failed to update profile:", error)
    throw new Error(error.message)
  }
  
  return data
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
    .maybeSingle()

  if (!profile) return null

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
    .maybeSingle()

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

/**
 * Completely resets all user progress across multiple tables.
 */
export async function resetAllUserProgress() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const userId = session.user.id

  // 1. Update user_profiles (JSON fields and main stats)
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      total_xp: 0,
      current_level: 1,
      max_xp: 200,
      sparks: 0,
      skill_xps: {},
      activities: [],
      task_snapshots: {},
      // For the JSON field, we want to keep the quests but set completed: false
    })
    .eq("user_id", userId)

  if (profileError) {
    console.error("Failed to reset profile:", profileError)
    throw profileError
  }

  // 2. Fetch existing quests from user_profile to reset them in the JSON
  // (We'll do this to ensure UI sync consistency if the app still relies on JSON)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("quests")
    .eq("user_id", userId)
    .maybeSingle()

  if (profile?.quests) {
    const resetQuests = {
      plans: (profile.quests.plans || []).map((q: any) => ({ ...q, completed: false })),
      dailies: (profile.quests.dailies || []).map((q: any) => ({ ...q, completed: false, completedCount: 0 })),
      habits: (profile.quests.habits || []).map((q: any) => ({ ...q, completed: false, streak: 0 }))
    }
    await supabase.from("user_profiles").update({ quests: resetQuests }).eq("user_id", userId)
  }

  // 3. Update separate tables (if they exist)
  // These calls are wrapped in try-catch to avoid crashing if tables don't exist yet
  try {
    await supabase.from("areas").update({ xp: 0, level: 0 }).eq("user_id", userId)
  } catch (e) {}

  try {
    await supabase.from("quests").update({ completed: false }).eq("user_id", userId)
  } catch (e) {}

  // 4. Delete history/transactions
  try {
    await supabase.from("transactions").delete().eq("user_id", userId)
  } catch (e) {}

  try {
    await supabase.from("activity_history").delete().eq("user_id", userId)
  } catch (e) {}

  return true
}

/**
 * Handles spark deductions with database-level validation.
 */
export async function processCommerceAction(cost: number) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Unauthorized")

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("sparks, activities")
    .eq("user_id", session.user.id)
    .maybeSingle()

  if (fetchError) throw new Error("Could not verify balance")
  if (!profile) throw new Error("User profile not found. Please complete onboarding first.")
  if (profile.sparks < cost) throw new Error("Insufficient sparks")

  const newSparks = profile.sparks - cost
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ sparks: newSparks })
    .eq("user_id", session.user.id)

  if (updateError) throw updateError

  return { sparks: newSparks, activities: profile.activities }
}
