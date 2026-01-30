// Planning Dashboard - File Scanner & Markdown Parser

import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { Project, Task, Output, ParsedFrontmatter } from './types';

const PLANNING_DIR = process.env.PLANNING_DIR || '/home/bean/Development/planning';

/**
 * Scan all project-* directories in the planning folder
 */
export function scanProjects(): string[] {
  if (!fs.existsSync(PLANNING_DIR)) {
    throw new Error(`Planning directory not found: ${PLANNING_DIR}`);
  }

  const entries = fs.readdirSync(PLANNING_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith('project-'))
    .map(entry => path.join(PLANNING_DIR, entry.name));
}

/**
 * Parse the Meta section from markdown files (format used in this planning system)
 */
function parseMetaSection(content: string): ParsedFrontmatter {
  const meta: ParsedFrontmatter = {};

  // Look for Meta section (## Meta to next ##)
  const metaMatch = content.match(/## Meta\s*\n([\s\S]*?)(?=\n##|$)/);
  if (!metaMatch) return meta;

  const metaContent = metaMatch[1];
  const lines = metaContent.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const match = line.match(/^- (.*?):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Convert key to camelCase for consistency
      const camelKey = key.toLowerCase().replace(/-(.)/g, (_, c) => c.toUpperCase());
      meta[camelKey] = value.trim();
    }
  }

  return meta;
}

/**
 * Parse project overview file
 */
export function parseProject(projectPath: string): Project | null {
  const overviewPath = path.join(projectPath, '00-OVERVIEW.md');

  if (!fs.existsSync(overviewPath)) {
    console.warn(`No overview file found: ${overviewPath}`);
    return null;
  }

  const content = fs.readFileSync(overviewPath, 'utf-8');
  const slug = path.basename(projectPath);

  // Extract title from the file
  const titleMatch = content.match(/^# .*?: (.*)$/m);
  const title = titleMatch ? titleMatch[1] : slug.replace('project-', '').replace(/-/g, ' ');

  // Extract objective from Snapshot section
  const objectiveMatch = content.match(/## Snapshot[\s\S]*?^- Objective:\s*(.*)$/m);
  const objective = objectiveMatch ? objectiveMatch[1] : 'No objective defined';

  // Extract success metrics
  const metricsMatch = content.match(/^- Success metrics:?\s*([\s\S]*?)(?=- |$)/);
  let successMetrics: string[] = [];
  if (metricsMatch) {
    const metricsText = metricsMatch[1];
    successMetrics = metricsText
      .split('\n')
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0);
  }

  // Extract target date
  const targetDateMatch = content.match(/^- Target date\(s\):\s*(.*)$/m);
  const targetDate = targetDateMatch ? targetDateMatch[1] : undefined;

  // Get last modified time
  const stats = fs.statSync(overviewPath);
  const lastUpdated = stats.mtime.toISOString();

  return {
    slug,
    title,
    objective,
    successMetrics,
    status: 'active', // Default status for projects
    priority: 'P2',
    stakeholder: 'Bean',
    planner: '/home/bean/agents/planner',
    targetDate,
    lastUpdated,
    path: overviewPath,
  };
}

/**
 * Parse task file
 */
export function parseTask(projectPath: string, taskPath: string): Task | null {
  if (!fs.existsSync(taskPath)) {
    console.warn(`Task file not found: ${taskPath}`);
    return null;
  }

  const content = fs.readFileSync(taskPath, 'utf-8');
  const meta = parseMetaSection(content);

  const taskId = path.basename(taskPath, '.md');
  const projectSlug = path.basename(projectPath);

  // Extract title from heading
  const titleMatch = content.match(/^# .*?: (.*)$/m);
  const title = titleMatch ? titleMatch[1] : taskId;

  // Extract goal
  const goalMatch = content.match(/## Goal\s*\n([\s\S]*?)(?=\n##|$)/);
  const goal = goalMatch ? goalMatch[1].trim() : undefined;

  // Extract acceptance criteria
  const criteriaMatch = content.match(/## Acceptance Criteria[\s\S]*?([\s\S]*?)(?=\n##|$)/);
  let acceptanceCriteria: string[] = [];
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1];
    acceptanceCriteria = criteriaText
      .split('\n')
      .filter(line => line.trim().startsWith('- ['))
      .map(line => line.trim().replace(/^-\s*\[[ xX]\]\s*/, ''));
  }

  // Extract outputs from Outputs section
  const outputsMatch = content.match(/## Outputs[\s\S]*?([\s\S]*?)(?=\n##|$)/);
  const outputs: Task['outputs'] = [];
  if (outputsMatch) {
    const outputsText = outputsMatch[1];
    const summaryMatch = outputsText.match(/^- Summary:\s*(.*)$/m);
    if (summaryMatch) {
      outputs.push({
        title: 'Summary',
        description: summaryMatch[1].trim(),
      });
    }
  }

  // Get last modified time
  const stats = fs.statSync(taskPath);
  const lastUpdated = stats.mtime.toISOString();

  return {
    id: taskId,
    project: projectSlug,
    title,
    owner: meta.owner || 'Unassigned',
    status: (meta.status as any) || 'todo',
    priority: meta.priority || 'P2',
    dependsOn: meta.dependsOn,
    created: meta.created || lastUpdated,
    updated: meta.updated || lastUpdated,
    goal,
    acceptanceCriteria,
    outputs,
    path: taskPath,
  };
}

/**
 * Parse output files from a project
 */
export function parseOutputs(projectPath: string): Output[] {
  const outputs: Output[] = [];
  const outputsDir = path.join(projectPath, 'outputs');

  if (!fs.existsSync(outputsDir)) {
    return outputs;
  }

  const files = fs.readdirSync(outputsDir);
  const projectSlug = path.basename(projectPath);

  for (const file of files) {
    const filePath = path.join(outputsDir, file);
    const stats = fs.statSync(filePath);

    // Only include markdown files
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/^# (.*)$/m);
      const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

      // Try to extract task ID from filename (e.g., T-001.md)
      const taskMatch = file.match(/^(T-\d+)(?:-.*)?\.md$/);
      const taskId = taskMatch ? taskMatch[1] : undefined;

      outputs.push({
        id: `${projectSlug}-${file.replace('.md', '')}`,
        project: projectSlug,
        task: taskId,
        title,
        content: content.substring(0, 500), // Preview only
        path: filePath,
        lastModified: stats.mtime.toISOString(),
      });
    }
  }

  return outputs;
}

/**
 * Parse all data from the planning directory
 */
export function parseAllData(): { projects: Project[]; tasks: Task[]; outputs: Output[] } {
  const projects: Project[] = [];
  const tasks: Task[] = [];
  const outputs: Output[] = [];

  const projectDirs = scanProjects();

  for (const projectPath of projectDirs) {
    // Parse project
    const project = parseProject(projectPath);
    if (project) {
      projects.push(project);
    }

    // Parse tasks
    const tasksDir = path.join(projectPath, 'tasks');
    if (fs.existsSync(tasksDir)) {
      const taskFiles = fs.readdirSync(tasksDir).filter(f => f.startsWith('T-') && f.endsWith('.md'));
      for (const taskFile of taskFiles) {
        const taskPath = path.join(tasksDir, taskFile);
        const task = parseTask(projectPath, taskPath);
        if (task) {
          tasks.push(task);
        }
      }
    }

    // Parse outputs
    const projectOutputs = parseOutputs(projectPath);
    outputs.push(...projectOutputs);
  }

  return { projects, tasks, outputs };
}
