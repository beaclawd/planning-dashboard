// Planning Dashboard - Project Store (MongoDB)
//
// This module provides persistent storage for projects, tasks, and outputs in MongoDB.
// MongoDB is now the single source of truth for all planning data.
//
// MongoDB Connection Pattern:
// - Single client instance (singleton)
// - Automatic connection management
// - Graceful error handling
// - Environment-based configuration

import { MongoClient, Db, Collection } from 'mongodb';
import { Project, Task, Output } from './types';

// MongoDB connection state
let client: MongoClient | null = null;
let db: Db | null = null;
let projectsCollection: Collection<Project> | null = null;
let tasksCollection: Collection<Task> | null = null;
let outputsCollection: Collection<Output> | null = null;

const DB_NAME = 'planning-dashboard';
const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const OUTPUTS_COLLECTION = 'outputs';

/**
 * Initialize MongoDB connection
 * @returns Promise that resolves when connected
 */
export async function connect(): Promise<Db> {
  const MONGO_URL = process.env.MONGO_URL;

  if (!MONGO_URL) {
    throw new Error('MONGO_URL environment variable is not set');
  }

  if (client && db) {
    return db;
  }

  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    projectsCollection = db.collection<Project>(PROJECTS_COLLECTION);
    tasksCollection = db.collection<Task>(TASKS_COLLECTION);
    outputsCollection = db.collection<Output>(OUTPUTS_COLLECTION);

    // Create indexes for projects collection
    await projectsCollection.createIndex({ slug: 1 }, { unique: true });
    await projectsCollection.createIndex({ status: 1 });
    await projectsCollection.createIndex({ priority: 1 });
    await projectsCollection.createIndex({ lastUpdated: -1 });

    // Create indexes for tasks collection
    // Composite unique index on project + id to allow same task IDs in different projects
    await tasksCollection.createIndex({ project: 1, id: 1 }, { unique: true });
    await tasksCollection.createIndex({ status: 1 });
    await tasksCollection.createIndex({ owner: 1 });
    await tasksCollection.createIndex({ updated: -1 });

    // Create indexes for outputs collection
    await outputsCollection.createIndex({ id: 1 }, { unique: true });
    await outputsCollection.createIndex({ project: 1 });
    await outputsCollection.createIndex({ task: 1 });
    await outputsCollection.createIndex({ lastModified: -1 });

    console.log('MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    client = null;
    db = null;
    projectsCollection = null;
    tasksCollection = null;
    outputsCollection = null;
    throw error;
  }
}

/**
 * Get MongoDB database instance
 * @returns Database instance or null if not connected
 */
export function getDb(): Db | null {
  return db;
}

/**
 * Get projects collection
 * @returns Collection instance or null if not connected
 */
export function getProjectsCollection(): Collection<Project> | null {
  return projectsCollection;
}

/**
 * Get tasks collection
 * @returns Collection instance or null if not connected
 */
export function getTasksCollection(): Collection<Task> | null {
  return tasksCollection;
}

/**
 * Get outputs collection
 * @returns Collection instance or null if not connected
 */
export function getOutputsCollection(): Collection<Output> | null {
  return outputsCollection;
}

/**
 * Close MongoDB connection
 */
export async function disconnect(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    client = null;
    db = null;
    projectsCollection = null;
    tasksCollection = null;
    outputsCollection = null;
  }
}

// ==================== PROJECTS ====================

/**
 * Store project in MongoDB
 * @param project Project to store
 * @returns Promise that resolves when stored
 */
export async function storeProject(project: Project): Promise<void> {
  if (!projectsCollection) {
    await connect();
  }

  if (!projectsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    await projectsCollection.replaceOne(
      { slug: project.slug },
      project,
      { upsert: true }
    );
    console.log(`Project stored: ${project.slug}`);
  } catch (error) {
    console.error('Error storing project:', error);
    throw error;
  }
}

/**
 * Get a single project by slug
 * @param slug Project slug
 * @returns Project or null if not found
 */
export async function getProject(slug: string): Promise<Project | null> {
  if (!projectsCollection) {
    await connect();
  }

  if (!projectsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const project = await projectsCollection.findOne({ slug });
    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

/**
 * Get all projects with optional filtering
 * @param filter Optional filter criteria
 * @returns Array of projects
 */
export async function getProjects(filter?: {
  status?: string;
  priority?: string;
  stakeholder?: string;
  planner?: string;
}): Promise<Project[]> {
  if (!projectsCollection) {
    await connect();
  }

  if (!projectsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const query = filter || {};
    const projects = await projectsCollection
      .find(query)
      .sort({ lastUpdated: -1 })
      .toArray();
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

/**
 * Delete a project by slug
 * @param slug Project slug
 * @returns Promise that resolves when deleted
 */
export async function deleteProject(slug: string): Promise<boolean> {
  if (!projectsCollection) {
    await connect();
  }

  if (!projectsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const result = await projectsCollection.deleteOne({ slug });
    console.log(`Project deleted: ${slug} (deleted: ${result.deletedCount})`);
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Batch store multiple projects
 * @param projects Array of projects to store
 * @returns Promise that resolves when all stored
 */
export async function storeProjects(projects: Project[]): Promise<void> {
  if (!projectsCollection) {
    await connect();
  }

  if (!projectsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const bulkOps = projects.map(project => ({
      replaceOne: {
        filter: { slug: project.slug },
        replacement: project,
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await projectsCollection.bulkWrite(bulkOps);
    }
    console.log(`Batch stored ${projects.length} projects`);
  } catch (error) {
    console.error('Error batch storing projects:', error);
    throw error;
  }
}

// ==================== TASKS ====================

/**
 * Store task in MongoDB
 * @param task Task to store
 * @returns Promise that resolves when stored
 */
export async function storeTask(task: Task): Promise<void> {
  if (!tasksCollection) {
    await connect();
  }

  if (!tasksCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    await tasksCollection.replaceOne(
      { project: task.project, id: task.id },
      task,
      { upsert: true }
    );
    console.log(`Task stored: ${task.project}/${task.id}`);
  } catch (error) {
    console.error('Error storing task:', error);
    throw error;
  }
}

/**
 * Get a single task by ID
 * @param id Task ID
 * @param project Project slug (optional, recommended for uniqueness)
 * @returns Task or null if not found
 */
export async function getTask(id: string, project?: string): Promise<Task | null> {
  if (!tasksCollection) {
    await connect();
  }

  if (!tasksCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const task = await tasksCollection.findOne(
      project ? { project, id } : { id }
    );
    return task;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
}

/**
 * Get all tasks with optional filtering
 * @param filter Optional filter criteria
 * @returns Array of tasks
 */
export async function getTasks(filter?: {
  project?: string;
  status?: string;
  owner?: string;
  priority?: string;
}): Promise<Task[]> {
  if (!tasksCollection) {
    await connect();
  }

  if (!tasksCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const query = filter || {};
    const tasks = await tasksCollection
      .find(query)
      .sort({ updated: -1 })
      .toArray();
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

/**
 * Delete a task by ID
 * @param id Task ID
 * @param project Project slug (optional, recommended for uniqueness)
 * @returns Promise that resolves when deleted
 */
export async function deleteTask(id: string, project?: string): Promise<boolean> {
  if (!tasksCollection) {
    await connect();
  }

  if (!tasksCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const result = await tasksCollection.deleteOne(
      project ? { project, id } : { id }
    );
    console.log(`Task deleted: ${project ? `${project}/${id}` : id} (deleted: ${result.deletedCount})`);
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Batch store multiple tasks
 * @param tasks Array of tasks to store
 * @returns Promise that resolves when all stored
 */
export async function storeTasks(tasks: Task[]): Promise<void> {
  if (!tasksCollection) {
    await connect();
  }

  if (!tasksCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const bulkOps = tasks.map(task => ({
      replaceOne: {
        filter: { project: task.project, id: task.id },
        replacement: task,
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await tasksCollection.bulkWrite(bulkOps);
    }
    console.log(`Batch stored ${tasks.length} tasks`);
  } catch (error) {
    console.error('Error batch storing tasks:', error);
    throw error;
  }
}

// ==================== OUTPUTS ====================

/**
 * Store output in MongoDB
 * @param output Output to store
 * @returns Promise that resolves when stored
 */
export async function storeOutput(output: Output): Promise<void> {
  if (!outputsCollection) {
    await connect();
  }

  if (!outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    await outputsCollection.replaceOne(
      { id: output.id },
      output,
      { upsert: true }
    );
    console.log(`Output stored: ${output.id}`);
  } catch (error) {
    console.error('Error storing output:', error);
    throw error;
  }
}

/**
 * Get a single output by ID
 * @param id Output ID
 * @returns Output or null if not found
 */
export async function getOutput(id: string): Promise<Output | null> {
  if (!outputsCollection) {
    await connect();
  }

  if (!outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const output = await outputsCollection.findOne({ id });
    return output;
  } catch (error) {
    console.error('Error fetching output:', error);
    throw error;
  }
}

/**
 * Get all outputs with optional filtering
 * @param filter Optional filter criteria
 * @returns Array of outputs
 */
export async function getOutputs(filter?: {
  project?: string;
  task?: string;
}): Promise<Output[]> {
  if (!outputsCollection) {
    await connect();
  }

  if (!outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const query = filter || {};
    const outputs = await outputsCollection
      .find(query)
      .sort({ lastModified: -1 })
      .toArray();
    return outputs;
  } catch (error) {
    console.error('Error fetching outputs:', error);
    throw error;
  }
}

/**
 * Delete an output by ID
 * @param id Output ID
 * @returns Promise that resolves when deleted
 */
export async function deleteOutput(id: string): Promise<boolean> {
  if (!outputsCollection) {
    await connect();
  }

  if (!outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const result = await outputsCollection.deleteOne({ id });
    console.log(`Output deleted: ${id} (deleted: ${result.deletedCount})`);
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting output:', error);
    throw error;
  }
}

/**
 * Batch store multiple outputs
 * @param outputs Array of outputs to store
 * @returns Promise that resolves when all stored
 */
export async function storeOutputs(outputs: Output[]): Promise<void> {
  if (!outputsCollection) {
    await connect();
  }

  if (!outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const bulkOps = outputs.map(output => ({
      replaceOne: {
        filter: { id: output.id },
        replacement: output,
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await outputsCollection.bulkWrite(bulkOps);
    }
    console.log(`Batch stored ${outputs.length} outputs`);
  } catch (error) {
    console.error('Error batch storing outputs:', error);
    throw error;
  }
}

// ==================== SYNC ALL ====================

/**
 * Sync all data to MongoDB (replaces all collections)
 * @param projects Array of projects
 * @param tasks Array of tasks
 * @param outputs Array of outputs
 * @returns Promise that resolves when all synced
 */
export async function syncAll({
  projects,
  tasks,
  outputs,
}: {
  projects: Project[];
  tasks: Task[];
  outputs: Output[];
}): Promise<void> {
  if (!projectsCollection || !tasksCollection || !outputsCollection) {
    await connect();
  }

  if (!projectsCollection || !tasksCollection || !outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    // Store all data in parallel
    await Promise.all([
      storeProjects(projects),
      storeTasks(tasks),
      storeOutputs(outputs),
    ]);

    console.log('✅ All data synced to MongoDB');
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
}

// ==================== STATISTICS ====================

/**
 * Get project statistics
 * @returns Object with project statistics
 */
export async function getProjectStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}> {
  if (!projectsCollection) {
    await connect();
  }

  if (!projectsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const total = await projectsCollection.countDocuments();

    const byStatus = await projectsCollection
      .aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } },
      ])
      .toArray();

    const byPriority = await projectsCollection
      .aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $project: { priority: '$_id', count: 1, _id: 0 } },
      ])
      .toArray();

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
}

/**
 * Get overall statistics for all collections
 * @returns Object with all statistics
 */
export async function getAllStats(): Promise<{
  projects: number;
  tasks: number;
  outputs: number;
}> {
  if (!projectsCollection || !tasksCollection || !outputsCollection) {
    await connect();
  }

  if (!projectsCollection || !tasksCollection || !outputsCollection) {
    throw new Error('Failed to connect to MongoDB');
  }

  try {
    const [projects, tasks, outputs] = await Promise.all([
      projectsCollection.countDocuments(),
      tasksCollection.countDocuments(),
      outputsCollection.countDocuments(),
    ]);

    return { projects, tasks, outputs };
  } catch (error) {
    console.error('Error fetching all stats:', error);
    throw error;
  }
}

/**
 * Health check for MongoDB connection
 * @returns Promise that resolves with connection status
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    if (!client) {
      // Try to connect
      await connect();
    }

    if (!client) {
      return { connected: false, message: 'Failed to initialize MongoDB client' };
    }

    await client.db().admin().ping();
    return { connected: true, message: 'MongoDB connection healthy' };
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
