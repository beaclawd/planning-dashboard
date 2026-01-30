import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { parseAllData } from '@/lib/parser';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project');
    const task = searchParams.get('task');

    // Try to get from cache first
    let cached = cache.get();
    if (!cached) {
      // Parse data from files
      const { projects, tasks, outputs } = parseAllData();
      cache.set({ projects, tasks, outputs, lastSync: new Date().toISOString() });
      cached = cache.get()!;
    }

    // Filter outputs
    let outputs = cached.outputs;

    if (project) {
      outputs = outputs.filter(o => o.project === project);
    }

    if (task) {
      outputs = outputs.filter(o => o.task === task);
    }

    return NextResponse.json(outputs);
  } catch (error) {
    console.error('Error fetching outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outputs', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
