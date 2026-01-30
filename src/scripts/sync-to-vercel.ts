#!/usr/bin/env tsx
// Sync script - Scan planning folder and POST data to Vercel webhook

import { parseAllData } from '../lib/parser';

const WEBHOOK_URL = process.env.VERCEL_WEBHOOK_URL || 'http://localhost:3000/api/webhook/sync';

async function syncToVercel() {
  try {
    console.log('🔍 Scanning planning directory...');

    // Parse all data from files
    const { projects, tasks, outputs } = parseAllData();

    console.log(`✅ Found ${projects.length} projects, ${tasks.length} tasks, ${outputs.length} outputs`);

    // Prepare sync payload
    const payload = {
      projects,
      tasks,
      outputs,
      lastSync: new Date().toISOString(),
    };

    console.log(`📤 Posting to webhook: ${WEBHOOK_URL}`);

    // POST to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Sync successful!');
    console.log('Response:', result);
    console.log(`   - ${result.stats.projects} projects`);
    console.log(`   - ${result.stats.tasks} tasks`);
    console.log(`   - ${result.stats.outputs} outputs`);

  } catch (error) {
    console.error('❌ Sync failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run sync
syncToVercel();
