import { formatDuration } from "@/modules/tasks/utils";
import type { TopTask } from "../utils";

interface TopTasksProps {
  tasks: TopTask[];
}

export function TopTasks({ tasks }: TopTasksProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tracked time yet. Enter the zone for a task to see it here.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {tasks.map((task, i) => (
        <li
          key={task.taskId}
          className="flex items-center justify-between gap-3 rounded-md border bg-card/30 px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
            <span className="truncate font-medium">{task.title}</span>
          </div>
          <span className="font-mono text-xs">
            {formatDuration(task.totalSeconds)}
          </span>
        </li>
      ))}
    </ol>
  );
}
