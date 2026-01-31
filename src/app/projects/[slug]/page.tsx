'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task, Output } from '@/lib/types';
import { TaskTable } from '@/components/task-table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle2, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { OutputsViewer } from '@/components/outputs-viewer';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingOutputs, setLoadingOutputs] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(`/api/tasks?project=${projectSlug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [projectSlug]);

  const handleViewOutputs = async (task: Task) => {
    setSelectedTask(task);
    setLoadingOutputs(true);
    try {
      const response = await fetch(`/api/outputs?task=${task.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch outputs');
      }
      const data = await response.json();
      setOutputs(data);
    } catch (err) {
      console.error('Error fetching outputs:', err);
      setOutputs([]);
    } finally {
      setLoadingOutputs(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
            <p className="font-medium">Error loading tasks</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <Link href="/" className="text-primary hover:underline">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedTask ? (
          // Project view
          <>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Link>

            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 capitalize">
                    {projectSlug.replace(/-/g, ' ')}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{totalTasks} tasks</span>
                    <span>{completedTasks} completed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    {progress}% Complete
                  </Badge>
                </div>
              </div>
            </div>

            <TaskTable
              tasks={tasks}
              projectSlug={projectSlug}
              onViewOutputs={handleViewOutputs}
            />
          </>
        ) : (
          // Outputs view
          <>
            <button
              onClick={() => setSelectedTask(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to tasks
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline" className={getStatusColor(selectedTask.status)}>
                  {selectedTask.status.replace(/_/g, ' ')}
                </Badge>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{selectedTask.owner}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(selectedTask.updated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {loadingOutputs ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading outputs...
              </div>
            ) : (
              <OutputsViewer outputs={outputs} taskId={selectedTask.id} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'done':
      return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
    case 'in_progress':
      return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
    case 'review':
      return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    case 'blocked':
      return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
  }
}
