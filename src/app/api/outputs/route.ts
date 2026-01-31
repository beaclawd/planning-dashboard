import { NextRequest, NextResponse } from 'next/server';
import { getOutputs } from '@/lib/project-store';

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
    let task = searchParams.get('task');

    // Normalize task ID to ensure T- prefix
    if (task) {
      task = normalizeTaskId(task);
    }

    // Build filter object (type assertion for MongoDB query)
    const filter: Record<string, string> = {};

    if (project) filter.project = project;
    if (task) filter.task = task;

    // Query MongoDB
    const outputs = await getOutputs(filter as any);

    console.log(`Returning ${outputs.length} outputs (filtered: project=${project}, task=${task})`);
    return NextResponse.json(outputs);
  } catch (error) {
    console.error('Error fetching outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outputs', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
