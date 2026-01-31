import { NextRequest, NextResponse } from 'next/server';
import { parseAllData } from '@/lib/parser';
import { syncAll, disconnect, getAllStats, healthCheck } from '@/lib/project-store';

/**
 * Cron job endpoint for automatic sync
 * Runs every 5 minutes to sync local files to MongoDB
 */
export async function GET(request: NextRequest) {
  // Verify this is a cron job (Vercel Cron Jobs header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Cron sync triggered - syncing to MongoDB');

    // Parse fresh data from local files
    const { projects, tasks, outputs } = parseAllData();

    // Sync to MongoDB
    await syncAll({ projects, tasks, outputs });

    // Get statistics from MongoDB to verify
    const stats = await getAllStats();

    // Check MongoDB health
    const health = await healthCheck();

    // Close connection
    await disconnect();

    return NextResponse.json({
      success: true,
      action: 'mongo_synced',
      message: health.message,
      timestamp: new Date().toISOString(),
      stats: {
        projects: stats.projects,
        tasks: stats.tasks,
        outputs: stats.outputs,
      },
    });
  } catch (error) {
    console.error('Error in cron sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync to MongoDB',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
