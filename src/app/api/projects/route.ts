import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { parseAllData } from '@/lib/parser';

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    const cached = cache.get();
    if (cached) {
      return NextResponse.json(cached.projects);
    }

    // Parse data from files
    const { projects, tasks, outputs } = parseAllData();

    // Update cache
    cache.set({ projects, tasks, outputs, lastSync: new Date().toISOString() });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
