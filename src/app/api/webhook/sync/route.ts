import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the sync data
    if (!body.projects || !body.tasks || !body.outputs) {
      return NextResponse.json(
        { error: 'Invalid sync data. Missing required fields: projects, tasks, outputs' },
        { status: 400 }
      );
    }

    // Update the cache with the new data
    cache.set({
      projects: body.projects,
      tasks: body.tasks,
      outputs: body.outputs,
      lastSync: body.lastSync || new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Cache updated successfully',
      timestamp: new Date().toISOString(),
      stats: {
        projects: body.projects.length,
        tasks: body.tasks.length,
        outputs: body.outputs.length,
      },
    });
  } catch (error) {
    console.error('Error processing sync webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process sync', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return cache status
  const cacheAge = cache.getAge();
  const isValid = cache.isValid();

  return NextResponse.json({
    status: isValid ? 'active' : 'expired',
    age: cacheAge,
    isValid,
    timestamp: new Date().toISOString(),
  });
}
