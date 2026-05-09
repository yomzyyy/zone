"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { STATUS_STYLES } from "@/modules/tasks/constants";
import type { Tag, Task } from "@/modules/tasks/types";
import { buildMonthGrid, dateKey, WEEKDAY_LABELS } from "../utils";

interface MonthViewProps {
  reference: Date;
  tasks: Task[];
  tags: Tag[];
  onSelectTask: (task: Task) => void;
  onCreateTaskOnDate: (dateIso: string, title: string) => void;
}

interface PopoverState {
  date: Date;
  tasks: Task[];
  anchor: DOMRect;
}

const POPOVER_WIDTH = 240;

export function MonthView({
  reference,
  tasks,
  onSelectTask,
  onCreateTaskOnDate,
}: MonthViewProps) {
  const days = useMemo(() => buildMonthGrid(reference), [reference]);

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

  const [popover, setPopover] = useState<PopoverState | null>(null);

  function openPopoverFromCell(
    cellEl: HTMLElement,
    date: Date,
    dayTasks: Task[],
  ) {
    setPopover({
      date,
      tasks: dayTasks,
      anchor: cellEl.getBoundingClientRect(),
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-7 border-b text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 flex-1 overflow-hidden">
        {days.map((day) => {
          const key = dateKey(day.date);
          const dayTasks = tasksByDate.get(key) ?? [];

          return (
            <div
              key={key}
              data-day-cell
              className={cn(
                "relative flex min-h-[80px] cursor-pointer flex-col gap-1 border-b border-r p-1 transition-colors",
                "hover:bg-card/40",
                !day.inCurrentMonth && "bg-muted/20 text-muted-foreground",
              )}
              onClick={(e) => {
                openPopoverFromCell(e.currentTarget, day.date, dayTasks);
              }}
            >
              <span
                className={cn(
                  "self-start rounded-full px-1.5 text-xs",
                  day.isToday && "bg-foreground text-background font-semibold",
                )}
              >
                {day.date.getDate()}
              </span>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTask(task);
                    }}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[11px] text-left",
                      STATUS_STYLES[task.status],
                    )}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="self-start rounded px-1 text-[10px] text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {popover && (
        <DayPopover
          state={popover}
          onClose={() => setPopover(null)}
          onSelectTask={(task) => {
            setPopover(null);
            onSelectTask(task);
          }}
          onCreateTaskOnDate={(iso, title) => {
            setPopover(null);
            onCreateTaskOnDate(iso, title);
          }}
        />
      )}
    </div>
  );
}

interface DayPopoverProps {
  state: PopoverState;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onCreateTaskOnDate: (iso: string, title: string) => void;
}

function DayPopover({
  state,
  onClose,
  onSelectTask,
  onCreateTaskOnDate,
}: DayPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [adding, setAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  // Position the popover near the anchor cell, flipping when it would overflow
  // the viewport. Run as a layout effect so we measure before paint.
  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const { anchor } = state;

    let left = anchor.left;
    if (left + rect.width > window.innerWidth - 8) {
      left = anchor.right - rect.width;
    }
    left = Math.max(8, Math.min(left, window.innerWidth - rect.width - 8));

    let top = anchor.top;
    if (top + rect.height > window.innerHeight - 8) {
      top = anchor.bottom - rect.height;
    }
    top = Math.max(8, Math.min(top, window.innerHeight - rect.height - 8));

    setPosition({ left, top });
  }, [state]);

  // Close on outside click or Escape.
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const weekday = state.date.toLocaleDateString(undefined, { weekday: "short" });
  const dayNum = state.date.getDate();
  const iso = dateKey(state.date);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={`Tasks on ${weekday} ${dayNum}`}
      style={{
        position: "fixed",
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        width: POPOVER_WIDTH,
        opacity: position ? 1 : 0,
        zIndex: 50,
      }}
      className="rounded-lg border bg-popover text-popover-foreground shadow-lg"
    >
      <div className="flex items-start justify-between gap-2 px-3 pt-4 pb-2">
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {weekday}
          </span>
          <span className="text-xl font-bold">{dayNum}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground p-1 -mr-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto px-2 pb-2 scrollbar-subtle">
        {state.tasks.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            No tasks yet.
          </p>
        ) : (
          state.tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task)}
              className="shrink-0 rounded-md bg-card px-2 py-1.5 text-xs text-card-foreground text-left ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25 break-words [overflow-wrap:anywhere]"
            >
              {task.title}
            </button>
          ))
        )}
      </div>

      <div className="border-t px-2 py-1.5">
        {adding ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (draftTitle.trim()) {
                  onCreateTaskOnDate(iso, draftTitle);
                  setDraftTitle("");
                  setAdding(false);
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                setAdding(false);
                setDraftTitle("");
              }
            }}
            onBlur={() => {
              if (draftTitle.trim()) {
                onCreateTaskOnDate(iso, draftTitle);
              }
              setAdding(false);
              setDraftTitle("");
            }}
            placeholder="Task title..."
            className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New task
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
