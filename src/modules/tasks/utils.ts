import type { Column, Task, TaskStatus } from "./types";

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = (n: number) =>
    Math.floor(Math.random() * 16 ** n)
      .toString(16)
      .padStart(n, "0");
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
}

export function totalSeconds(task: Task): number {
  return task.timeLog.reduce((sum, entry) => sum + entry.durationSeconds, 0);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function statusForColumn(
  column: Column | undefined,
  fallback: TaskStatus = "todo",
): TaskStatus {
  return column?.status ?? fallback;
}

export function tasksInColumn(tasks: Task[], columnId: string): Task[] {
  return tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.position - b.position);
}

export function reindexPositions(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({ ...task, position: index }));
}

export function todayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
