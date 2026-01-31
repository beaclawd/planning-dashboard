import { NextRequest, NextResponse } from 'next/server';
import { syncAll, disconnect, getAllStats, healthCheck } from '@/lib/project-store';

/**
 * POST - Sync data to MongoDB (webhook endpoint)
 * Accepts projects, tasks, outputs and syncs them to MongoDB
 */
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

    // Sync to MongoDB
    await syncAll({
      projects: body.projects,
      tasks: body.tasks,
      outputs: body.outputs,
    });

    // Close connection
    await disconnect();

    return NextResponse.json({
      success: true,
      message: 'MongoDB synced successfully',
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
      { error: 'Failed to sync to MongoDB', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Return MongoDB status
 * Used by frontend to check sync status
 */
export async function GET() {
  try {
    // Check MongoDB health
    const health = await healthCheck();

    // Get statistics from MongoDB
    const stats = await getAllStats();

    // Close connection
    await disconnect();

    return NextResponse.json({
      status: health.connected ? 'active' : 'disconnected',
      message: health.message,
      stats: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking MongoDB status:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
