import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { parseAllData } from '@/lib/parser';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project');
    const status = searchParams.get('status');
    const owner = searchParams.get('owner');

    // Try to get from cache first
    let cached = cache.get();
    if (!cached) {
      // Parse data from files
      const { projects, tasks, outputs } = parseAllData();
      cache.set({ projects, tasks, outputs, lastSync: new Date().toISOString() });
      cached = cache.get()!;
    }

    // Filter tasks
    let tasks = cached.tasks;

    if (project) {
      tasks = tasks.filter(t => t.project === project);
    }

    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    if (owner) {
      tasks = tasks.filter(t => t.owner.toLowerCase().includes(owner.toLowerCase()));
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
