import { NextRequest, NextResponse } from 'next/server';
import { parseAllData } from '@/lib/parser';
import { syncAll, disconnect, getAllStats } from '@/lib/project-store';

/**
 * Manual refresh endpoint
 * Triggers sync script to parse files and write to MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Manual refresh requested - syncing to MongoDB');

    // Parse fresh data from local files
    const { projects, tasks, outputs } = parseAllData();

    // Sync to MongoDB
    await syncAll({ projects, tasks, outputs });

    // Get statistics from MongoDB to verify
    const stats = await getAllStats();

    // Close connection
    await disconnect();

    return NextResponse.json({
      success: true,
      message: 'MongoDB synced successfully',
      timestamp: new Date().toISOString(),
      stats: {
        projects: stats.projects,
        tasks: stats.tasks,
        outputs: stats.outputs,
      },
    });
  } catch (error) {
    console.error('Error in manual refresh:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh MongoDB',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
