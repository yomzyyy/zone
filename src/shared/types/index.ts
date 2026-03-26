// Shared types used across multiple modules.
// Each module will also have its own types/ folder for module-specific types.

// Priority levels for tasks
export type Priority = "low" | "medium" | "high" | "urgent";

// Task status — independent of which column the task is in
export type TaskStatus = "todo" | "in_progress" | "done";

// Timer modes
export type TimerMode = "stopwatch" | "pomodoro";
