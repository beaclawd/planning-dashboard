// Sync Script - Parse planning data and sync to MongoDB
//
// This script:
// 1. Scans the planning directory for markdown files
// 2. Parses all projects, tasks, and outputs
// 3. Writes all data to MongoDB as the single source of truth
// 4. Vercel API routes then read from MongoDB

import dotenv from 'dotenv';
import { parseAllData } from '../lib/parser';
import { syncAll, disconnect, getAllStats, healthCheck } from '../lib/project-store';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check for --prod flag (legacy, now just for logging)
const isProd = process.argv.includes('--prod');

async function syncToMongoDB() {
  try {
    const target = isProd ? 'Production (MongoDB)' : 'Local (MongoDB)';
    console.log(`🔍 Starting sync to MongoDB... [${target}]`);

    // Check MongoDB health
    console.log('🏥 Checking MongoDB connection...');
    const health = await healthCheck();
    if (!health.connected) {
      throw new Error(`MongoDB connection failed: ${health.message}`);
    }
    console.log(`✅ MongoDB connected: ${health.message}`);

    // Parse all data from files
    console.log('📂 Parsing markdown files...');
    const { projects, tasks, outputs } = parseAllData();

    console.log(`✅ Found ${projects.length} projects, ${tasks.length} tasks, ${outputs.length} outputs`);

    // Sync all data to MongoDB
    console.log('📤 Syncing data to MongoDB...');
    await syncAll({ projects, tasks, outputs });

    // Get statistics to verify sync
    const stats = await getAllStats();
    console.log('✅ Sync successful!');
    console.log('MongoDB statistics:');
    console.log(`   - ${stats.projects} projects`);
    console.log(`   - ${stats.tasks} tasks`);
    console.log(`   - ${stats.outputs} outputs`);

    // Close connection
    await disconnect();
    console.log('👋 MongoDB connection closed');

  } catch (error) {
    console.error('❌ Sync failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run sync
syncToMongoDB();
