export type TaskStatus = "todo" | "in_progress" | "done";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TimeLogEntry {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  note: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  tagIds: string[];
  position: number;
  timeLog: TimeLogEntry[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  status: TaskStatus;
  position: number;
  isDefault: boolean;
}

export interface BoardState {
  columns: Column[];
  tasks: Task[];
  tags: Tag[];
}
