import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/lib/project-store';

/**
 * Normalize task ID to match MongoDB format (T-XXX)
 * Handles both formats: "003" or "T-003" -> "T-003"
 */
function normalizeTaskId(taskId: string): string {
  if (!taskId) return taskId;
  // If it doesn't start with T-, add the prefix
  return taskId.startsWith('T-') ? taskId : `T-${taskId}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project');
    const status = searchParams.get('status');
    const owner = searchParams.get('owner');
    const priority = searchParams.get('priority');
    let taskId = searchParams.get('id');

    // Normalize task ID to ensure T- prefix
    if (taskId) {
      taskId = normalizeTaskId(taskId);
    }

    // Build filter object (type assertion for MongoDB query)
    const filter: Record<string, string> = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (priority) filter.priority = priority;
    if (taskId) filter.id = taskId;

    // Query MongoDB
    const tasks = await getTasks(filter as any);

    console.log(`Returning ${tasks.length} tasks (filtered: project=${project}, status=${status}, id=${taskId})`);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
