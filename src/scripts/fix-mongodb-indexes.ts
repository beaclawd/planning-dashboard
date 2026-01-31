// Fix MongoDB indexes - Drop old single index that conflicts with composite

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = 'planning-dashboard';
const TASKS_COLLECTION = 'tasks';

async function fixIndexes() {
  if (!MONGO_URL) {
    throw new Error('MONGO_URL environment variable is not set');
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const tasksCollection = db.collection(TASKS_COLLECTION);

  try {
    console.log('Getting current indexes...');
    const indexes = await tasksCollection.indexes();
    console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

    // Drop the old unique index on 'id' if it exists
    const oldIndex = indexes.find(i => i.name === 'id_1' && i.unique === true);
    if (oldIndex) {
      console.log('Dropping old unique index: id_1');
      await tasksCollection.dropIndex('id_1');
      console.log('✅ Old unique index dropped');
    } else {
      console.log('No old unique index to drop');
    }

    // Verify new indexes
    const newIndexes = await tasksCollection.indexes();
    console.log('Final indexes:', newIndexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

    console.log('✅ Indexes fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    throw error;
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

fixIndexes();
