import { Project } from '@/lib/types';

interface ProgressBarProps {
  project: Project;
  tasks?: { project: string; status: string }[];
}

export function ProgressBar({ project, tasks = [] }: ProgressBarProps) {
  const projectTasks = tasks.filter(t => t.project === project.slug);
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length;
  const totalTasks = projectTasks.length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getStatusColor = () => {
    if (completionRate === 100) return 'bg-green-500';
    if (completionRate >= 50) return 'bg-blue-500';
    if (completionRate >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">
          {completedTasks} / {totalTasks} tasks ({completionRate}%)
        </span>
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${completionRate}%` }}
        />
      </div>
      {inProgressTasks > 0 && (
        <div className="text-xs text-muted-foreground">
          {inProgressTasks} task(s) in progress
        </div>
      )}
    </div>
  );
}
