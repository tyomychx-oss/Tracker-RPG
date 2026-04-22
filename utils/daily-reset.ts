/**
 * Utility for handling UTC-based Daily quest resets.
 * Strictly uses 'last_completed_at' (timestamptz) as requested.
 */

export function checkAndResetDailies(quests: any) {
    if (!quests) return { updatedQuests: quests, resetCount: 0 };

    const now = new Date();
    const nowUtc = now.getTime();
    let totalResetCount = 0;

    // 1. DAILIES RESET
    const dailies = quests.dailies || [];
    const updatedDailies = dailies.map((quest: any) => {
        const periodDays = quest.frequency_period_days || 1;
        const resetTimeStr = quest.reset_time || "00:00";
        const [resetHour, resetMin] = resetTimeStr.split(":").map(Number);

        if (quest.is_completed && !quest.last_completed_at) {
            totalResetCount++;
            return { ...quest, is_completed: false, completed_count: 0, last_completed_at: null };
        }
        if (!quest.last_completed_at) return quest;

        const lastCompletedAt = new Date(quest.last_completed_at).getTime();
        const nextReset = new Date(lastCompletedAt);
        nextReset.setUTCDate(nextReset.getUTCDate() + periodDays);
        nextReset.setUTCHours(resetHour, resetMin, 0, 0);

        if (nowUtc >= nextReset.getTime()) {
            totalResetCount++;
            return { ...quest, is_completed: false, completed_count: 0 };
        }
        return quest;
    });

    // 2. HABITS WEEKLY RESET (Monday 00:00 UTC)
    const habits = quests.habits || [];
    const updatedHabits = habits.map((quest: any) => {
        // If not completed and no progress, nothing to reset
        if (!quest.is_completed && (quest.completed_count === 0 || quest.completed_count === undefined)) {
            return quest;
        }

        // We use last_completed_at as the reference for the last weekly cycle
        // If missing, we reset if is_completed is true (safety fallback)
        if (!quest.last_completed_at) {
            if (quest.is_completed) {
                totalResetCount++;
                return { ...quest, is_completed: false, completed_count: 0 };
            }
            return quest;
        }

        const lastCompletedAt = new Date(quest.last_completed_at);
        
        // Calculate the next Monday 00:00 UTC boundary after the last completion
        const nextMonday = new Date(lastCompletedAt);
        nextMonday.setUTCHours(0, 0, 0, 0);
        const day = nextMonday.getUTCDay(); // 0 (Sun) - 6 (Sat)
        // If day is 1 (Mon), we still want the NEXT Monday
        const daysToMonday = day === 0 ? 1 : (8 - day);
        nextMonday.setUTCDate(nextMonday.getUTCDate() + daysToMonday);

        if (nowUtc >= nextMonday.getTime()) {
            totalResetCount++;
            return {
                ...quest,
                is_completed: false,
                completed_count: 0
                // Streak is preserved as requested
            };
        }
        return quest;
    });

    return {
        updatedQuests: { 
            ...quests, 
            dailies: updatedDailies,
            habits: updatedHabits
        },
        resetCount: totalResetCount
    };
}

