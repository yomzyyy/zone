"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Card } from "@/shared/components/ui/card";
import type { Tag, Task } from "../types";
import { formatDuration, totalSeconds } from "../utils";
import { PriorityBadge } from "./priority-badge";

interface TaskCardProps {
  task: Task;
  tags: Tag[];
  onClick?: () => void;
  onToggleComplete?: (taskId: string) => void;
  isRunning?: boolean;
}

export function TaskCard({
  task,
  tags,
  onClick,
  onToggleComplete,
  isRunning,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", columnId: task.columnId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardTags = tags.filter((t) => task.tagIds.includes(t.id));
  const time = formatDuration(totalSeconds(task));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      data-task-card
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        if (e.detail === 0) return;
        onClick?.();
      }}
      className={cn(
        "group shrink-0 p-3 cursor-grab active:cursor-grabbing space-y-2 select-none",
        isDragging && "opacity-50",
        task.completed && "opacity-60",
        "hover:border-foreground/20 transition-colors",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.(task.id);
          }}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
        <p
          className={cn(
            "min-w-0 flex-1 text-sm font-medium leading-snug break-words [overflow-wrap:anywhere]",
            task.completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>
        {isRunning && (
          <span
            className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 mt-1.5"
            aria-label="Currently in zone"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <PriorityBadge priority={task.priority} />
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {time}
        </span>
      </div>

      {cardTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cardTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block rounded-full px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: `${tag.color}26`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
