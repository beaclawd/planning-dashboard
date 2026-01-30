'use client';

import { Task, TaskStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, AlertCircle, FileText, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTimelineProps {
  tasks: Task[];
  sortBy?: 'status' | 'date' | 'priority';
}

export function ProgressTimeline({ tasks, sortBy = 'status' }: ProgressTimelineProps) {
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return <Check className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'review':
        return <FileText className="h-4 w-4" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4" />;
      case 'todo':
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'in_progress':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'review':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'blocked':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'todo':
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-red-500/10 text-red-500';
      case 'P1':
        return 'bg-orange-500/10 text-orange-500';
      case 'P2':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const sortTasks = (tasks: Task[]) => {
    const sorted = [...tasks];

    switch (sortBy) {
      case 'status':
        const statusOrder: TaskStatus[] = ['done', 'review', 'in_progress', 'blocked', 'todo'];
        return sorted.sort((a, b) => {
          const aIndex = statusOrder.indexOf(a.status);
          const bIndex = statusOrder.indexOf(b.status);
          if (aIndex !== bIndex) return aIndex - bIndex;
          return a.priority.localeCompare(b.priority);
        });
      case 'priority':
        return sorted.sort((a, b) => a.priority.localeCompare(b.priority));
      case 'date':
      default:
        return sorted.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    }
  };

  const sortedTasks = sortTasks(tasks);

  const groupByStatus = (tasks: Task[]) => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    };

    tasks.forEach(task => {
      groups[task.status].push(task);
    });

    return groups;
  };

  const groupedTasks = groupByStatus(sortedTasks);

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Status Groups */}
      {(['in_progress', 'review', 'blocked', 'todo', 'done'] as TaskStatus[]).map((status) => {
        const statusTasks = groupedTasks[status];
        if (statusTasks.length === 0) return null;

        const isComplete = status === 'done';
        const isInProgress = status === 'in_progress';
        const isReview = status === 'review';
        const isBlocked = status === 'blocked';

        return (
          <div key={status} className="relative">
            {/* Timeline Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-full border', getStatusColor(status))}>
                {getStatusIcon(status)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{getStatusLabel(status)}</h3>
                <p className="text-sm text-muted-foreground">
                  {statusTasks.length} task{statusTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
              {isInProgress && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 animate-pulse">
                  Active
                </Badge>
              )}
              {isBlocked && (
                <Badge variant="outline" className="bg-red-500/10 text-red-500">
                  Needs Attention
                </Badge>
              )}
            </div>

            {/* Timeline Content */}
            <div className="ml-4 space-y-3">
              {statusTasks.map((task, index) => (
                <Card
                  key={task.id}
                  className={cn(
                    'relative overflow-hidden',
                    index === statusTasks.length - 1 ? '' : 'before:absolute before:left-[-18px] before:top-8 before:bottom-[-12px] before:w-0.5 before:bg-border'
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-1">{task.title}</CardTitle>
                        {task.goal && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.goal}
                          </p>
                        )}
                      </div>
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Acceptance Criteria:</p>
                        <ul className="space-y-1">
                          {task.acceptanceCriteria.map((criteria, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className={cn('mt-1', isComplete ? 'text-green-500' : 'text-muted-foreground')}>
                                {isComplete ? '✓' : '○'}
                              </span>
                              <span className={cn(isComplete ? 'line-through text-muted-foreground' : '')}>
                                {criteria}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {sortedTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks to display</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CompactProgressTimelineProps {
  tasks: Task[];
  showCount?: boolean;
}

export function CompactProgressTimeline({ tasks, showCount = true }: CompactProgressTimelineProps) {
  const statusOrder: TaskStatus[] = ['done', 'review', 'in_progress', 'blocked', 'todo'];

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'review':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      case 'todo':
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {statusOrder.map((status) => {
        const count = tasks.filter(t => t.status === status).length;
        if (count === 0 && !showCount) return null;

        return (
          <Badge key={status} variant="outline" className="gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', getStatusColor(status))} />
            <span>{getStatusLabel(status)}</span>
            {showCount && <span className="text-muted-foreground">({count})</span>}
          </Badge>
        );
      })}
    </div>
  );
}
