import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '@/lib/project-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const stakeholder = searchParams.get('stakeholder');
    const planner = searchParams.get('planner');

    // Build filter object
    const filter: {
      status?: string;
      priority?: string;
      stakeholder?: string;
      planner?: string;
    } = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (stakeholder) filter.stakeholder = stakeholder;
    if (planner) filter.planner = planner;

    // Query MongoDB
    const projects = await getProjects(filter);

    console.log(`Returning ${projects.length} projects (filtered: status=${!!status}, priority=${!!priority})`);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
