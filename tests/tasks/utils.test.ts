import { describe, it, expect } from "vitest";
import {
  formatDuration,
  generateId,
  reindexPositions,
  tasksInColumn,
  totalSeconds,
} from "@/modules/tasks/utils";
import type { Task } from "@/modules/tasks/types";

const baseTask = (overrides: Partial<Task> = {}): Task => ({
  id: "t-1",
  columnId: "col-todo",
  title: "Test",
  note: "",
  status: "todo",
  priority: "medium",
  dueDate: null,
  tagIds: [],
  position: 0,
  timeLog: [],
  completed: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("tasks/utils", () => {
  it("generates unique UUIDs", () => {
    const a = generateId();
    const b = generateId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });

  it("formats durations human-readably", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(3600)).toBe("1h 00m");
    expect(formatDuration(3725)).toBe("1h 02m");
  });

  it("computes total seconds from time log", () => {
    const task = baseTask({
      timeLog: [
        {
          id: "log-1",
          startedAt: "",
          endedAt: "",
          durationSeconds: 60,
        },
        {
          id: "log-2",
          startedAt: "",
          endedAt: "",
          durationSeconds: 120,
        },
      ],
    });
    expect(totalSeconds(task)).toBe(180);
  });

  it("filters and sorts tasks within a column", () => {
    const tasks: Task[] = [
      baseTask({ id: "t-1", columnId: "col-a", position: 1 }),
      baseTask({ id: "t-2", columnId: "col-b", position: 0 }),
      baseTask({ id: "t-3", columnId: "col-a", position: 0 }),
    ];
    const result = tasksInColumn(tasks, "col-a");
    expect(result.map((t) => t.id)).toEqual(["t-3", "t-1"]);
  });

  it("reindexes positions sequentially", () => {
    const tasks: Task[] = [
      baseTask({ id: "t-1", position: 99 }),
      baseTask({ id: "t-2", position: 5 }),
      baseTask({ id: "t-3", position: 50 }),
    ];
    const reindexed = reindexPositions(tasks);
    expect(reindexed.map((t) => t.position)).toEqual([0, 1, 2]);
  });
});
