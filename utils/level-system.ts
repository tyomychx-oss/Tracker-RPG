/**
 * Level System based on quadratic formula: XP = 50 * (Level ^ 2)
 * 
 * Examples:
 * - 0 XP -> Level 1
 * - 200 XP -> Level 2 (50 * 2^2 = 200)
 * - 5000 XP -> Level 10 (50 * 10^2 = 5000)
 */

/**
 * Calculate the current level based on total XP
 * @param totalXp - Total XP accumulated
 * @returns Current level (minimum 1)
 */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) {
    return 1
  }
  
  // Level = sqrt(XP / 50)
  const level = Math.sqrt(totalXp / 50)
  
  // Floor to get current level (not yet reached next level)
  return Math.floor(level) || 1
}

/**
 * Calculate XP required for a specific level
 * @param level - Target level
 * @returns XP required to reach that level
 */
export function getXpForLevel(level: number): number {
  if (level < 1) {
    return 0
  }
  return 50 * (level * level)
}

/**
 * Calculate progress percentage (0-100) to the next level
 * @param totalXp - Total XP accumulated
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(totalXp: number): number {
  if (totalXp <= 0) {
    return 0
  }
  
  const currentLevel = calculateLevel(totalXp)
  const currentLevelXp = getXpForLevel(currentLevel)
  const nextLevelXp = getXpForLevel(currentLevel + 1)
  
  // XP progress within current level
  const xpInCurrentLevel = totalXp - currentLevelXp
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp
  
  // Calculate percentage
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, progress))
}

/**
 * Get XP required to reach the next level
 * @param totalXp - Total XP accumulated
 * @returns XP needed to reach next level
 */
export function getXpToNextLevel(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp)
  const currentLevelXp = getXpForLevel(currentLevel)
  const nextLevelXp = getXpForLevel(currentLevel + 1)
  
  return nextLevelXp - totalXp
}









