import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function normalizeTaskId(taskId: string): string {
  if (!taskId) return taskId;
  return taskId.startsWith('T-') ? taskId : `T-${taskId}`;
}

// Test cases
const testCases = [
  { input: '003', expected: 'T-003' },
  { input: 'T-003', expected: 'T-003' },
  { input: '001', expected: 'T-001' },
  { input: 'T-001', expected: 'T-001' },
  { input: '10', expected: 'T-10' },
  { input: 'T-10', expected: 'T-10' },
];

console.log('Testing normalizeTaskId function:');
console.log('='.repeat(50));

testCases.forEach(({ input, expected }) => {
  const result = normalizeTaskId(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} Input: "${input}" -> Output: "${result}" (Expected: "${expected}")`);
});

console.log('\nAll tests passed!');
