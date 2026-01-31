// Planning Dashboard - File Scanner & Markdown Parser

import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { Project, Task, Output, ParsedFrontmatter, TaskStatus } from './types';

const PLANNING_DIR = process.env.PLANNING_DIR || '/home/bean/Development/planning';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Parse meta section from markdown content
 */
function parseMetaSection(content: string): ParsedFrontmatter {
  const meta: ParsedFrontmatter = {};

  // Extract Meta section
  const metaMatch = content.match(/## Meta\s*\n([\s\S]*?)(?=\n##|$)/);
  if (!metaMatch) {
    return meta;
  }

  const metaLines = metaMatch[1].split('\n');

  for (const line of metaLines) {
    const match = line.match(/^\s*-\s*([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();

      // Convert key to camelCase
      const camelKey = key
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());

      // Handle empty values
      if (value === '-' || value === '') {
        meta[camelKey] = undefined;
      } else {
        meta[camelKey] = value;
      }
    }
  }

  return meta;
}

/**
 * Scan all project-* directories in planning folder
 */
export function scanProjects(): string[] {
  if (!fs.existsSync(PLANNING_DIR)) {
    console.warn(`Planning directory not found: ${PLANNING_DIR}`);
    return [];
  }

  const entries = fs.readdirSync(PLANNING_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith('project-'))
    .map(entry => path.join(PLANNING_DIR, entry.name));
}

/**
 * Parse the OVERVIEW file
 */
export function parseProject(projectPath: string): Project | null {
  const overviewPath = path.join(projectPath, '00-OVERVIEW.md');

  if (!fs.existsSync(overviewPath)) {
    console.warn(`No overview file found: ${overviewPath}`);
    return null;
  }

  const content = fs.readFileSync(overviewPath, 'utf-8');
  const slug = path.basename(projectPath);

  // Extract title from file
  const titleMatch = content.match(/^# .*?: (.*)$/m);
  const title = titleMatch ? titleMatch[1] : slug.replace('project-', '').replace(/-/g, ' ');

  // Extract objective from Snapshot section
  const objectiveMatch = content.match(/## Snapshot[\s\S]*?^- Objective:\s*(.*)$/m);
  const objective = objectiveMatch ? objectiveMatch[1] : 'No objective defined';

  // Extract success metrics
  const metricsMatch = content.match(/^- Success metrics:?\s*([\s\S]*?)(?=- |$)/m);
  let successMetrics: string[] = [];
  if (metricsMatch) {
    const metricsText = metricsMatch[1];
    const lines = metricsText.split('\n');
    successMetrics = lines
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0);
  }

  // Extract meta (status, priority, etc.)
  const meta = parseMetaSection(content);

  const lastUpdated = content.match(/- (Last|last) Updated:\s*(.*)$/m)
    ? meta.lastUpdated || new Date().toISOString()
    : meta.lastUpdated || new Date().toISOString();

  return {
    slug,
    title,
    objective,
    successMetrics,
    status: meta.status || 'active',
    priority: meta.priority || 'P2',
    stakeholder: meta.stakeholder,
    planner: meta.planner,
    targetDate: meta.targetDate,
    lastUpdated,
    path: overviewPath,
  };
}

/**
 * Parse task file
 */
export function parseTask(taskPath: string): Task | null {
  if (!fs.existsSync(taskPath)) {
    console.warn(`Task file not found: ${taskPath}`);
    return null;
  }

  const content = fs.readFileSync(taskPath, 'utf-8');
  const match = content.match(/^# T-(\d+): (.*)$/m);

  if (!match) {
    console.warn(`Invalid task file format: ${taskPath}`);
    return null;
  }

  const [, id, title] = match;
  const projectPath = path.dirname(path.dirname(taskPath));
  const project = path.basename(projectPath);

  const meta = parseMetaSection(content);
  const goalMatch = content.match(/## Goal\s*\n([\s\S]*?)(?=\n##|$)/);
  const goal = goalMatch ? goalMatch[1].trim() : undefined;

  const criteriaMatch = content.match(/## Acceptance Criteria \(Definition of Done\)[\s\S]*?^- Acceptance Criteria:\s*\n([\s\S]*?)(?=\n##|$)/);
  let acceptanceCriteria: string[] = [];
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1];
    acceptanceCriteria = criteriaText
      .split('\n')
      .map(line => line.trim().replace(/^\[-]\s*/, ''))
      .filter(line => line.length > 0);
  }

  const lastUpdated = meta.updated || new Date().toISOString();

  return {
    id,
    title,
    project,
    owner: meta.owner || 'Unassigned',
    status: (meta.status as TaskStatus) || 'todo',
    priority: meta.priority || 'P2',
    dependsOn: meta.dependsOn,
    created: meta.created || new Date().toISOString(),
    updated: lastUpdated,
    goal,
    acceptanceCriteria,
    path: taskPath,
  };
}

/**
 * Parse output file
 */
export function parseOutput(outputPath: string): Output | null {
  if (!fs.existsSync(outputPath)) {
    console.warn(`Output file not found: ${outputPath}`);
    return null;
  }

  const content = fs.readFileSync(outputPath, 'utf-8');
  const match = content.match(/^# (.*): (.*)$/m);

  if (!match) {
    console.warn(`Invalid output file format: ${outputPath}`);
    return null;
  }

  const [, id, title] = match;
  const projectPath = path.dirname(path.dirname(outputPath));
  const project = path.basename(projectPath);

  const metaMatch = content.match(/^- Output Type:\s*(.*)$/m);
  const outputType = metaMatch ? metaMatch[1] : 'unknown';
  const taskMatch = content.match(/^- Task ID:\s*(.*)$/m);
  const taskId = taskMatch ? taskMatch[1] : undefined;

  const lastModifiedMatch = content.match(/^- (Last|last) Modified:\s*(.*)$/m);
  const lastModified = lastModifiedMatch ? lastModifiedMatch[2] : new Date().toISOString();

  return {
    id,
    title,
    project,
    task: taskId,
    outputType,
    content: content.substring(content.indexOf('\n\n') + 2), // Get content after metadata
    path: outputPath,
    lastModified,
  };
}

/**
 * Parse all data from planning directory
 * Used by sync script to read local files and write to MongoDB
 * In production (Vercel), returns empty arrays since files are not accessible
 */
export function parseAllData() {
  // In production on Vercel, local files are not accessible
  // Data is read from MongoDB instead
  if (IS_PROD) {
    console.log('Production mode - skipping file scan (data from MongoDB)');
    return { projects: [], tasks: [], outputs: [] };
  }

  console.log('Development mode - scanning files from:', PLANNING_DIR);

  // Scan all projects
  const projectDirs = scanProjects();
  const projects: Project[] = [];
  const tasks: Task[] = [];
  const outputs: Output[] = [];

  for (const projectPath of projectDirs) {
    const project = parseProject(projectPath);
    if (project) {
      projects.push(project);
    }

    // Scan tasks
    const tasksDir = path.join(projectPath, 'tasks');
    if (fs.existsSync(tasksDir)) {
      const taskFiles = fs.readdirSync(tasksDir)
        .filter(file => file.startsWith('T-') && file.endsWith('.md'));

      for (const taskFile of taskFiles) {
        const task = parseTask(path.join(tasksDir, taskFile));
        if (task) {
          tasks.push(task);
        }
      }
    }

    // Scan outputs
    const outputsDir = path.join(projectPath, 'outputs');
    if (fs.existsSync(outputsDir)) {
      const taskOutputDirs = fs.readdirSync(outputsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name.startsWith('T-'))
        .map(entry => entry.name);

      for (const taskDir of taskOutputDirs) {
        const taskOutputPath = path.join(outputsDir, taskDir);
        const outputFiles = fs.readdirSync(taskOutputPath)
          .filter(file => file.endsWith('.md'));

        for (const outputFile of outputFiles) {
          const output = parseOutput(path.join(taskOutputPath, outputFile));
          if (output) {
            outputs.push(output);
          }
        }
      }
    }
  }

  return { projects, tasks, outputs };
}
