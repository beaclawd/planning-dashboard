import { Task } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

interface TaskTableProps {
  tasks: Task[];
  projectSlug?: string;
  onViewOutputs?: (task: Task) => void;
}

export function TaskTable({ tasks, projectSlug, onViewOutputs }: TaskTableProps) {
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

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Task</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[100px]">Owner</TableHead>
              <TableHead className="min-w-[60px]">Priority</TableHead>
              <TableHead className="hidden md:table-cell min-w-[120px]">Updated</TableHead>
              {!projectSlug && <TableHead className="hidden md:table-cell min-w-[150px]">Project</TableHead>}
              <TableHead className="min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="min-w-[200px]">
                    <div className="font-medium">{task.title}</div>
                    {task.goal && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {task.goal}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell min-w-[100px]">
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{task.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[60px]">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-[120px]">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(task.updated).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  {!projectSlug && (
                    <TableCell className="hidden md:table-cell min-w-[150px]">
                      <Link
                        href={`/projects/${task.project}`}
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        {task.project}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="min-w-[100px]">
                    {onViewOutputs && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewOutputs(task)}
                        className="hover:bg-primary hover:text-primary-foreground min-h-[44px] min-w-[44px]"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Outputs</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
