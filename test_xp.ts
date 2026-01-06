
const calculateTotalXP = (level: number, currentXP: number) => {
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

// Test cases
console.log("Level 1, 50 XP:", calculateTotalXP(1, 50)); // Should be 50
console.log("Level 2, 0 XP:", calculateTotalXP(2, 0)); // Should be 200 (Level 1 max)
console.log("Level 2, 50 XP:", calculateTotalXP(2, 50)); // Should be 250
console.log("Level 3, 0 XP:", calculateTotalXP(3, 0)); // Level 1 (200) + Level 2 (280) = 480

const l1 = 200;
const l2 = Math.floor(200 * 1.4); // 280
console.log("L1 max:", l1);
console.log("L2 max:", l2);
