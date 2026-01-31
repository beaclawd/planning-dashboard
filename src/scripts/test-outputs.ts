import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
  const client = new MongoClient(process.env.MONGO_URL!);
  await client.connect();
  const db = client.db('planning-dashboard');

  // Get all outputs
  const allOutputs = await db.collection('outputs').find({}).toArray();
  console.log(`\n=== Total outputs in MongoDB: ${allOutputs.length} ===\n`);

  // Show outputs for planning-dashboard
  const pdOutputs = allOutputs.filter(o => o.project === 'project-planning-dashboard');
  console.log(`\n=== Outputs for project-planning-dashboard: ${pdOutputs.length} ===\n`);
  pdOutputs.forEach(o => {
    console.log(`- ID: ${o.id}, Title: ${o.title}, Task: ${o.task}, Type: ${o.outputType}`);
  });

  // Show unique project values
  console.log('\n=== All unique project values ===');
  const projects = new Set(allOutputs.map(o => o.project));
  console.log(Array.from(projects));

  // Show unique task values
  console.log('\n=== All unique task values ===');
  const tasks = new Set(allOutputs.map(o => o.task).filter(t => t));
  console.log(Array.from(tasks));

  // Test query with task filter
  console.log('\n=== Query test: task=T-001 ===');
  const t001Outputs = await db.collection('outputs').find({ project: 'project-planning-dashboard', task: 'T-001' }).toArray();
  console.log(`Found: ${t001Outputs.length} outputs for T-001`);
  t001Outputs.forEach(o => {
    console.log(`- ${o.title}`);
  });

  await client.close();
}
test();
