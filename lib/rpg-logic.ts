export function calculateLevelFromTotalXP(totalXP: number): { level: number; currentXP: number; maxXP: number } {
    if (totalXP <= 0) return { level: 1, currentXP: 0, maxXP: 200 }
    let remainingXP = totalXP
    let level = 1
    let maxXP = 200
    while (remainingXP >= maxXP) {
        remainingXP -= maxXP
        level += 1
        maxXP = Math.floor(maxXP * 1.4)
    }
    return { level, currentXP: remainingXP, maxXP }
}

export function calculateTotalXP(level: number, currentXP: number): number {
    let total = currentXP
    let tempLevel = 1
    let tempMax = 200
    while (tempLevel < level) {
        total += tempMax
        tempLevel += 1
        tempMax = Math.floor(tempMax * 1.4)
    }
    return total
}

export function addXPToState(prevXP: number, prevLevel: number, amount: number) {
    const totalXPBefore = calculateTotalXP(prevLevel, prevXP)
    const totalXPAfter = totalXPBefore + amount
    const { level, currentXP, maxXP } = calculateLevelFromTotalXP(totalXPAfter)
    return { totalXP: currentXP, currentLevel: level, maxXP }
}

export function removeXPFromState(prevXP: number, prevLevel: number, amount: number) {
    const totalXPBefore = calculateTotalXP(prevLevel, prevXP)
    const totalXPAfter = Math.max(0, totalXPBefore - amount)
    const { level, currentXP, maxXP } = calculateLevelFromTotalXP(totalXPAfter)
    return { totalXP: currentXP, currentLevel: level, maxXP }
}
