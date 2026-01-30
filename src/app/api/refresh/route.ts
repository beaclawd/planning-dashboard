import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { parseAllData } from '@/lib/parser';

/**
 * Manual refresh endpoint
 * Forces a cache refresh regardless of age
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Manual refresh requested');

    // Parse fresh data
    const { projects, tasks, outputs } = parseAllData();

    // Update cache
    cache.set({
      projects,
      tasks,
      outputs,
      lastSync: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: new Date().toISOString(),
      stats: {
        projects: projects.length,
        tasks: tasks.length,
        outputs: outputs.length,
      },
    });
  } catch (error) {
    console.error('Error in manual refresh:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
