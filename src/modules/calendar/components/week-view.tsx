"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Input } from "@/shared/components/ui/input";
import { PriorityBadge } from "@/modules/tasks/components/priority-badge";
import type { Tag, Task } from "@/modules/tasks/types";
import { buildWeekDays, dateKey, WEEKDAY_LABELS } from "../utils";

interface WeekViewProps {
  reference: Date;
  tasks: Task[];
  tags: Tag[];
  onSelectTask: (task: Task) => void;
  onCreateTaskOnDate: (dateIso: string, title: string) => void;
}

export function WeekView({
  reference,
  tasks,
  onSelectTask,
  onCreateTaskOnDate,
}: WeekViewProps) {
  const days = useMemo(() => buildWeekDays(reference), [reference]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  // At most one column is in "adding" state at a time. The active dateKey
  // owns the inline input; clicking a different column's "+ Add task"
  // moves the input there.
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingForDate) inputRef.current?.focus();
  }, [addingForDate]);

  function startAdding(key: string) {
    setAddingForDate(key);
    setDraftTitle("");
  }

  function commit() {
    if (addingForDate && draftTitle.trim()) {
      onCreateTaskOnDate(addingForDate, draftTitle);
    }
    setAddingForDate(null);
    setDraftTitle("");
  }

  function cancel() {
    setAddingForDate(null);
    setDraftTitle("");
  }

  return (
    // On phones the 7 columns can't all fit at a usable width — let the
    // whole row scroll horizontally and give each column a sensible minimum.
    <div className="scrollbar-subtle grid flex-1 grid-flow-col auto-cols-[minmax(150px,1fr)] gap-2 overflow-x-auto min-h-0 md:grid-flow-row md:grid-cols-7 md:auto-cols-auto md:overflow-x-visible">
      {days.map((day, idx) => {
        const key = dateKey(day.date);
        const dayTasks = tasksByDate.get(key) ?? [];
        const isAdding = addingForDate === key;
        return (
          <div
            key={key}
            className="flex min-h-0 flex-col gap-2 rounded-lg border bg-card/40 p-2"
          >
            <button
              type="button"
              onClick={() => startAdding(key)}
              className="flex shrink-0 items-baseline justify-between border-b pb-1 text-left hover:text-foreground"
            >
              <span className="text-xs uppercase text-muted-foreground">
                {WEEKDAY_LABELS[idx]}
              </span>
              <span
                className={cn(
                  "text-lg font-semibold",
                  day.isToday && "text-foreground",
                  !day.isToday && "text-muted-foreground",
                )}
              >
                {day.date.getDate()}
              </span>
            </button>

            <div className="scrollbar-subtle flex flex-1 flex-col gap-1.5 min-h-0 overflow-y-auto p-0.5 -m-0.5">
              {dayTasks.length === 0 && !isAdding && (
                <p className="text-xs text-muted-foreground">No tasks</p>
              )}
              {dayTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onSelectTask(task)}
                  className="min-w-0 shrink-0 space-y-1.5 rounded-lg bg-card p-2 text-left text-xs text-card-foreground ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25"
                >
                  <p className="font-medium leading-tight break-words [overflow-wrap:anywhere]">
                    {task.title}
                  </p>
                  <PriorityBadge priority={task.priority} />
                </button>
              ))}
            </div>

            {/* Inline add-task footer — Trello-style. Toggles between a
                "+ Add task" link and an input row. */}
            {isAdding ? (
              <div className="shrink-0">
                <Input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commit();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancel();
                    }
                  }}
                  onBlur={commit}
                  placeholder="Task title..."
                  className="h-8 text-xs"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startAdding(key)}
                className="flex shrink-0 items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
