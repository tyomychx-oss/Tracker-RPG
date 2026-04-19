import { checkAndResetDailies } from './utils/daily-reset';

// Mock data
const mockQuests = {
  dailies: [
    {
      id: 1,
      title: 'Test Daily (Past Reset)',
      completed: true,
      completedCount: 1,
      frequencyCount: 1,
      frequencyPeriodDays: 1,
      resetTime: '06:00',
      lastResetAt: new Date(Date.now() - 30 * 60 * 60 * 1000).getTime() // 30 hours ago
    },
    {
      id: 2,
      title: 'Test Daily (Future Reset)',
      completed: true,
      completedCount: 1,
      frequencyCount: 1,
      frequencyPeriodDays: 1,
      resetTime: '23:00',
      lastResetAt: new Date().setUTCHours(23, 0, 0, 0) - (24 * 60 * 60 * 1000) // Yesterday 23:00
    }
  ]
};

console.log('--- Initial State ---');
console.log(JSON.stringify(mockQuests, null, 2));

const { updatedQuests, resetCount } = checkAndResetDailies(mockQuests);

console.log('\n--- Result ---');
console.log(`Reset Count: ${resetCount}`);
console.log(JSON.stringify(updatedQuests, null, 2));

// Additional check for initialization
const freshQuests = {
    dailies: [
        { id: 3, title: 'Fresh Task', frequencyPeriodDays: 1, resetTime: '00:00' }
    ]
};
console.log('\n--- Initialization Test ---');
const { updatedQuests: initQuests } = checkAndResetDailies(freshQuests);
console.log(JSON.stringify(initQuests, null, 2));
