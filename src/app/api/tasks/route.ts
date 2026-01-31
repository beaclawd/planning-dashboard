import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/lib/project-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project');
    const status = searchParams.get('status');
    const owner = searchParams.get('owner');
    const priority = searchParams.get('priority');

    // Build filter object (type assertion for MongoDB query)
    const filter: Record<string, string> = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (priority) filter.priority = priority;

    // Query MongoDB
    const tasks = await getTasks(filter as any);

    console.log(`Returning ${tasks.length} tasks (filtered: project=${!!project}, status=${!!status}, owner=${!!owner})`);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
