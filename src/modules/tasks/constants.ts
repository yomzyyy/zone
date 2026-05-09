import type { Column, Priority, TaskStatus } from "./types";
import { generateId } from "./utils";

export const TASKS_STORAGE_KEY = "zone-board-state";

// Default columns are seeded with fresh UUIDs each call so all column IDs in
// the system are uniformly UUIDs (matches the Postgres `uuid` column type).
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

// Module-level snapshot — this is the value used as INITIAL_STATE for guests.
// Same UUIDs persist for the lifetime of the page; once written to localStorage
// they're stable across reloads.
export const DEFAULT_COLUMNS: Column[] = makeDefaultColumns();

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "urgent"];

// Tailwind color utility classes per priority. Light mode uses darker text against
// the same tinted background so the labels stay legible; dark: variants restore the
// softer pastel look on dark mode.
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

// Preset palette for tag colors (8 options).
export const TAG_PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
] as const;
