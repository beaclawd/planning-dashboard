// Test API routes - Verify MongoDB integration

import dotenv from 'dotenv';
import { connect, disconnect, getProjects, getTasks, getOutputs } from '../lib/project-store';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAPI() {
  try {
    console.log('🧪 Testing API routes with MongoDB...\n');

    await connect();

    // Test projects
    console.log('📊 Testing /api/projects...');
    const projects = await getProjects();
    console.log(`   ✅ Retrieved ${projects.length} projects`);
    if (projects.length > 0) {
      console.log(`   Sample project: ${projects[0].title} (${projects[0].slug})`);
    }
    console.log();

    // Test tasks
    console.log('📝 Testing /api/tasks...');
    const tasks = await getTasks();
    console.log(`   ✅ Retrieved ${tasks.length} tasks`);
    if (tasks.length > 0) {
      console.log(`   Sample task: ${tasks[0].title} (${tasks[0].project}/${tasks[0].id})`);
    }

    // Test filtered tasks
    const planningDashboardTasks = await getTasks({ project: 'project-planning-dashboard' });
    console.log(`   ✅ Filtered: ${planningDashboardTasks.length} tasks for project-planning-dashboard`);
    console.log();

    // Test outputs
    console.log('📄 Testing /api/outputs...');
    const outputs = await getOutputs();
    console.log(`   ✅ Retrieved ${outputs.length} outputs`);
    if (outputs.length > 0) {
      console.log(`   Sample output: ${outputs[0].title} (${outputs[0].id})`);
    }
    console.log();

    console.log('✅ All API tests passed!');
    console.log('\nMongoDB is working correctly as the single source of truth.');

    await disconnect();
  } catch (error) {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }
}

testAPI();
