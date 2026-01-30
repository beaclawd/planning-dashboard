// Planning Dashboard - Data Type Definitions

export interface Project {
  slug: string;
  title: string;
  objective: string;
  successMetrics: string[];
  status: string;
  priority: string;
  stakeholder?: string;
  planner?: string;
  targetDate?: string;
  lastUpdated: string;
  path: string;
}

export interface Task {
  id: string;
  project: string;
  title: string;
  owner: string;
  status: TaskStatus;
  priority: string;
  dependsOn?: string;
  created: string;
  updated: string;
  goal?: string;
  acceptanceCriteria: string[];
  outputs?: TaskOutput[];
  path: string;
}

export interface TaskOutput {
  title: string;
  path?: string;
  description?: string;
}

export interface Output {
  id: string;
  project: string;
  task?: string;
  title: string;
  content?: string;
  path: string;
  lastModified: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export interface ParsedFrontmatter {
  [key: string]: any;
}

export interface SyncData {
  projects: Project[];
  tasks: Task[];
  outputs: Output[];
  lastSync: string;
}

export interface CacheData {
  projects: Project[];
  tasks: Task[];
  outputs: Output[];
  lastSync: string;
  timestamp: number;
}
