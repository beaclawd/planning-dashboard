import { NextRequest, NextResponse } from 'next/server';
import { getOutputs } from '@/lib/project-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project');
    const task = searchParams.get('task');

    // Build filter object
    const filter: {
      project?: string;
      task?: string;
    } = {};

    if (project) filter.project = project;
    if (task) filter.task = task;

    // Query MongoDB
    const outputs = await getOutputs(filter);

    console.log(`Returning ${outputs.length} outputs (filtered: project=${!!project}, task=${!!task})`);
    return NextResponse.json(outputs);
  } catch (error) {
    console.error('Error fetching outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outputs', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
