'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/lib/types';
import { ProjectCard } from '@/components/project-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RefreshCw } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchProjects = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    }

    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);

      // Try to get last sync time from webhook status
      try {
        const statusResponse = await fetch('/api/webhook/sync');
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          if (status.timestamp) {
            setLastSync(status.timestamp);
          }
        }
      } catch {
        // Ignore status check errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Trigger manual refresh
      const response = await fetch('/api/refresh', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to refresh');
      }

      // Refetch projects
      await fetchProjects(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.objective.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
            <p className="font-medium">Error loading projects</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={() => fetchProjects()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Planning Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Multi-agent workflow planning dashboard
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {lastSync && (
            <p className="text-sm text-muted-foreground mb-4">
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}

          <div className="flex items-center gap-2 max-w-md">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'No projects found matching your search' : 'No projects available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
