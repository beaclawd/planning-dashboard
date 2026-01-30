import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { parseAllData } from '@/lib/parser';

/**
 * Cron job endpoint for polling fallback
 * Runs every 5 minutes to check for updates
 */
export async function GET(request: NextRequest) {
  // Verify this is a cron job (Vercel Cron Jobs header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse data from files (in production, this would come from a database or external API)
    // For now, we'll just check if cache is stale and refresh it
    const isStale = !cache.isValid();
    const cacheAge = cache.getAge();

    if (isStale) {
      console.log('Cache is stale, refreshing...');

      // Parse fresh data (in production, this would fetch from sync source)
      const { projects, tasks, outputs } = parseAllData();

      cache.set({
        projects,
        tasks,
        outputs,
        lastSync: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        action: 'cache_refreshed',
        timestamp: new Date().toISOString(),
        stats: {
          projects: projects.length,
          tasks: tasks.length,
          outputs: outputs.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      action: 'cache_ok',
      timestamp: new Date().toISOString(),
      cacheAge,
    });
  } catch (error) {
    console.error('Error in cron sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
