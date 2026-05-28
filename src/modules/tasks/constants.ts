import type { Column, Priority, TaskStatus } from "./types";
import { generateId } from "./utils";

export const TASKS_STORAGE_KEY = "zone-board-state";

export function makeDefaultColumns(): Column[] {
  return [
    { id: generateId(), name: "To Do", status: "todo", position: 0, isDefault: true },
    {
      id: generateId(),
      name: "In Progress",
      status: "in_progress",
      position: 1,
      isDefault: true,
    },
    { id: generateId(), name: "Done", status: "done", position: 2, isDefault: true },
  ];
}

export const DEFAULT_COLUMNS: Column[] = makeDefaultColumns();

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "urgent"];

export const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-zinc-500/15 text-zinc-700 border-zinc-500/40 dark:text-zinc-300 dark:border-zinc-500/30",
  medium:
    "bg-blue-500/15 text-blue-700 border-blue-500/40 dark:text-blue-300 dark:border-blue-500/30",
  high: "bg-orange-500/15 text-orange-700 border-orange-500/40 dark:text-orange-300 dark:border-orange-500/30",
  urgent:
    "bg-red-500/15 text-red-700 border-red-500/40 dark:text-red-300 dark:border-red-500/30",
};

export const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-zinc-200 text-zinc-900",
  in_progress: "bg-amber-300 text-amber-950",
  done: "bg-emerald-500/30 text-emerald-900 dark:text-emerald-200",
};

export const TAG_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
] as const;
