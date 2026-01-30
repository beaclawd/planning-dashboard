'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task } from '@/lib/types';
import { ProgressBar } from '@/components/progress-bar';
import { OutputsViewer } from '@/components/outputs-viewer';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, User, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;
  const taskId = params.taskId as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTask() {
      try {
        const response = await fetch(`/api/tasks?project=${projectSlug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        const foundTask = data.find((t: Task) => t.id === taskId);
        if (!foundTask) {
          throw new Error('Task not found');
        }
        setTask(foundTask);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [projectSlug, taskId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
            <p className="font-medium">Error loading task</p>
            <p className="text-sm mt-2">{error || 'Task not found'}</p>
          </div>
          <Link href={`/projects/${projectSlug}`} className="text-primary hover:underline">
            ← Back to project
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'review':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'blocked':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'todo':
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-red-500 text-white';
      case 'P1':
        return 'bg-orange-500 text-white';
      case 'P2':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isBlocked = task.status === 'blocked';

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href={`/projects/${projectSlug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to project
        </Link>

        {/* Task Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                    {task.priority}
                  </Badge>
                  {isBlocked && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Blocked
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
                <CardDescription>{task.id}</CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Owner: {task.owner}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Updated: {new Date(task.updated).toLocaleDateString()}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Goal */}
            {task.goal && (
              <div>
                <h3 className="font-semibold mb-2">Goal</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{task.goal}</p>
              </div>
            )}

            {/* Acceptance Criteria */}
            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Acceptance Criteria</h3>
                <div className="space-y-2">
                  {task.acceptanceCriteria.map((criteria, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {task.status === 'done' ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            ✓
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </div>
                      <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                        {criteria}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {task.dependsOn && (
              <div>
                <h3 className="font-semibold mb-2">Dependencies</h3>
                <Badge variant="outline">{task.dependsOn}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Outputs */}
        <Card>
          <CardHeader>
            <CardTitle>Task Outputs</CardTitle>
            <CardDescription>
              Artifacts and deliverables from this task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OutputsViewer projectId={projectSlug} taskId={taskId} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
