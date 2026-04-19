/**
 * Utility for handling UTC-based Daily quest resets.
 * Strictly uses 'last_completed_at' (timestamptz) as requested.
 */

export function checkAndResetDailies(quests: any) {
    if (!quests || !quests.dailies) return { updatedQuests: quests, resetCount: 0 };

    const dailies = quests.dailies;
    const now = new Date();
    const nowUtc = now.getTime();
    let resetCount = 0;

    const updatedDailies = dailies.map((quest: any) => {
        // Core Logic Parameters
        const periodDays = quest.frequency_period_days || 1;
        const resetTimeStr = quest.reset_time || "00:00";
        const [resetHour, resetMin] = resetTimeStr.split(":").map(Number);

        // 1. STALE COMPLETION LOGIC: 
        // If the task is marked completed but last_completed_at is missing, reset it immediately.
        if (quest.is_completed && !quest.last_completed_at) {
            resetCount++;
            return {
                ...quest,
                is_completed: false,
                completed_count: 0,
                last_completed_at: null
            };
        }

        // 2. INITIALIZATION: If last_completed_at is missing and not completed, just return.
        // The first completion will set the timestamp.
        if (!quest.last_completed_at) {
            return quest;
        }

        // 3. MATH: Calculate the Next Reset window
        const lastCompletedAt = new Date(quest.last_completed_at).getTime();
        
        // Next reset is at least 1 period after the last completion, aligned to resetTime
        const nextReset = new Date(lastCompletedAt);
        nextReset.setUTCDate(nextReset.getUTCDate() + periodDays);
        nextReset.setUTCHours(resetHour, resetMin, 0, 0);

        // Reset Condition: current UTC time has passed the Next Reset Timestamp
        if (nowUtc >= nextReset.getTime()) {
            resetCount++;
            
            // Calculate the most recent valid reset timestamp in case multiple periods passed
            // For dailies, we just reset to false. 
            // We don't necessarily need to update last_completed_at during reset, 
            // but we MUST clear is_completed.
            return {
                ...quest,
                is_completed: false,
                completed_count: 0
                // We keep last_completed_at as the reference of when it was LAST done.
            };
        }

        return quest;
    });

    return {
        updatedQuests: { ...quests, dailies: updatedDailies },
        resetCount
    };
}
