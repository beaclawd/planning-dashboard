// Test MongoDB Connection
// Usage: npx tsx src/scripts/test-mongodb.ts

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing project-store
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// NOW import project-store (after env vars are loaded)
import {
  connect,
  healthCheck,
  disconnect,
  getProjectStats,
} from '../lib/project-store';

async function testMongoDB() {
  console.log('🧪 Testing MongoDB Connection...\n');

  try {
    // Test 1: Connect
    console.log('1️⃣ Testing connection...');
    await connect();
    console.log('✅ Connection successful!\n');

    // Test 2: Health check
    console.log('2️⃣ Running health check...');
    const health = await healthCheck();
    console.log('Health status:', health);
    console.log('✅ Health check passed!\n');

    // Test 3: Get stats
    console.log('3️⃣ Fetching project stats...');
    const stats = await getProjectStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    console.log('✅ Stats retrieved!\n');

    // Test 4: Disconnect
    console.log('4️⃣ Disconnecting...');
    await disconnect();
    console.log('✅ Disconnected!\n');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMongoDB();
