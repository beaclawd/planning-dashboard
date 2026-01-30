'use client';

import { useState, useEffect } from 'react';
import { Project, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(`/api/tasks?project=${project.slug}`);
        if (!response.ok) return;
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [project.slug]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'blocked':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'todo':
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return '🟢';
      case 'in_progress':
        return '🟡';
      case 'blocked':
        return '🔴';
      case 'todo':
      default:
        return '⚪';
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

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors truncate">
                {project.title}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {project.objective}
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            {!loading && totalTasks > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks completed
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={getStatusColor(project.status)}>
                <span className="mr-1">{getStatusIcon(project.status)}</span>
                {project.status}
              </Badge>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {project.planner && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">{project.planner}</span>
                </div>
              )}

              {project.targetDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(project.targetDate).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(project.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
