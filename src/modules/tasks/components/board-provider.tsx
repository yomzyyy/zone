"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import {
  createClient,
  isSupabaseConfigured,
} from "@/shared/lib/supabase/client";
import {
  deleteColumnRow,
  deleteTagRow,
  deleteTaskRow,
  ensureDefaultColumns,
  fetchBoardState,
  insertColumnRow,
  insertTagRow,
  insertTaskRow,
  insertTimeLogRow,
  reindexColumnPositions,
  reindexTaskPositions,
  replaceTaskTags,
  updateColumnRow,
  updateTaskRow,
} from "@/shared/lib/supabase/queries/tasks";
import { migrateGuestData } from "@/modules/auth/utils/guest-migration";
import {
  DEFAULT_COLUMNS,
  TAG_PALETTE,
  TASKS_STORAGE_KEY,
} from "../constants";
import type {
  BoardState,
  Column,
  Priority,
  Tag,
  Task,
  TaskStatus,
  TimeLogEntry,
} from "../types";
import {
  generateId,
  reindexPositions,
  tasksInColumn,
  todayKey,
} from "../utils";

const INITIAL_STATE: BoardState = {
  columns: DEFAULT_COLUMNS,
  tasks: [],
  tags: [],
};

export interface CreateTaskInput {
  columnId?: string;
  title: string;
  note?: string;
  dueDate?: string | null;
  priority?: Priority;
  tagIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  note?: string;
  dueDate?: string | null;
  priority?: Priority;
  tagIds?: string[];
}

export interface BoardContextValue {
  state: BoardState;
  columns: Column[];
  tasks: Task[];
  tags: Tag[];
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (taskId: string, updates: UpdateTaskInput) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  moveTask: (taskId: string, toColumnId: string, toIndex: number) => void;
  addTimeLog: (taskId: string, entry: Omit<TimeLogEntry, "id">) => void;
  createColumn: (name: string, status?: TaskStatus) => Column;
  renameColumn: (columnId: string, name: string) => void;
  deleteColumn: (columnId: string) => void;
  moveColumn: (columnId: string, toIndex: number) => void;
  createTag: (name: string, color?: string) => Tag;
  deleteTag: (tagId: string) => void;
}

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined,
);

function fireAndForget<T>(label: string, p: Promise<T>) {
  p.catch((err) => {
    console.warn(`[board sync] ${label} failed:`, err);
  });
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<BoardState>(
    TASKS_STORAGE_KEY,
    INITIAL_STATE,
  );
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabaseRef = useRef(
    typeof window === "undefined" ? null : createClient(),
  );

  const sync = useMemo(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !isAuthenticated || !user || !isSupabaseConfigured()) {
      return null;
    }
    return { supabase, userId: user.id };
  }, [isAuthenticated, user]);

  const hydratedForUserRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = sync?.userId ?? null;
    if (currentUserId === lastUserIdRef.current) return;
    lastUserIdRef.current = currentUserId;

    if (!sync) {
      setState(INITIAL_STATE);
      hydratedForUserRef.current = null;
      return;
    }

    if (hydratedForUserRef.current === sync.userId) return;
    hydratedForUserRef.current = sync.userId;

    (async () => {
      try {
        await ensureDefaultColumns(sync.supabase, sync.userId);
        await migrateGuestData(sync.supabase, sync.userId);
        const fresh = await fetchBoardState(sync.supabase);
        if (fresh.columns.length === 0) return;
        setState({
          columns: fresh.columns,
          tasks: fresh.tasks,
          tags: fresh.tags,
        });
      } catch (err) {
        console.warn("[board sync] initial fetch failed:", err);
      }
    })();
  }, [authLoading, sync, setState]);

  useEffect(() => {
    setState((prev) => {
      const seen = new Set<string>();
      let changed = false;
      const cleaned: Task[] = [];
      for (const raw of prev.tasks) {
        if (seen.has(raw.id)) {
          changed = true;
          continue;
        }
        seen.add(raw.id);
        if (typeof raw.completed !== "boolean") {
          cleaned.push({ ...raw, completed: raw.status === "done" });
          changed = true;
        } else {
          cleaned.push(raw);
        }
      }
      if (!changed) return prev;
      return { ...prev, tasks: cleaned };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTask = useCallback(
    (input: CreateTaskInput): Task => {
      const now = new Date().toISOString();
      let createdTask: Task | null = null;

      setState((prev) => {
        const targetColumnId =
          input.columnId ?? prev.columns[0]?.id ?? DEFAULT_COLUMNS[0].id;
        const targetColumn = prev.columns.find((c) => c.id === targetColumnId);
        const status: TaskStatus = targetColumn?.status ?? "todo";
        const tasksInTarget = tasksInColumn(prev.tasks, targetColumnId);

        const task: Task = {
          id: generateId(),
          columnId: targetColumnId,
          title: input.title,
          note: input.note ?? "",
          status,
          priority: input.priority ?? "medium",
          dueDate: input.dueDate === undefined ? todayKey() : input.dueDate,
          tagIds: input.tagIds ?? [],
          position: tasksInTarget.length,
          timeLog: [],
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
        createdTask = task;
        return { ...prev, tasks: [...prev.tasks, task] };
      });

      const task = createdTask!;
      if (sync) {
        fireAndForget(
          "createTask",
          insertTaskRow(sync.supabase, sync.userId, task),
        );
      }
      return task;
    },
    [setState, sync],
  );

  const toggleTaskComplete = useCallback(
    (taskId: string) => {
      let newCompleted: boolean | null = null;
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id !== taskId) return task;
          newCompleted = !task.completed;
          return {
            ...task,
            completed: newCompleted,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));

      if (sync && newCompleted !== null) {
        fireAndForget(
          "toggleTaskComplete",
          updateTaskRow(sync.supabase, taskId, { completed: newCompleted }),
        );
      }
    },
    [setState, sync],
  );

  const updateTask = useCallback(
    (taskId: string, updates: UpdateTaskInput) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task,
        ),
      }));

      if (sync) {
        const patch: Parameters<typeof updateTaskRow>[2] = {};
        if (updates.title !== undefined) patch.title = updates.title;
        if (updates.note !== undefined) patch.note = updates.note;
        if (updates.priority !== undefined) patch.priority = updates.priority;
        if (updates.dueDate !== undefined) patch.due_date = updates.dueDate;
        if (Object.keys(patch).length > 0) {
          fireAndForget(
            "updateTask",
            updateTaskRow(sync.supabase, taskId, patch),
          );
        }
        if (updates.tagIds !== undefined) {
          fireAndForget(
            "updateTask.tags",
            replaceTaskTags(sync.supabase, taskId, updates.tagIds),
          );
        }
      }
    },
    [setState, sync],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      setState((prev) => {
        const remaining = prev.tasks.filter((t) => t.id !== taskId);
        const byColumn = new Map<string, Task[]>();
        for (const task of remaining) {
          const list = byColumn.get(task.columnId) ?? [];
          list.push(task);
          byColumn.set(task.columnId, list);
        }
        const renumbered: Task[] = [];
        for (const [, list] of byColumn) {
          list.sort((a, b) => a.position - b.position);
          renumbered.push(...reindexPositions(list));
        }
        return { ...prev, tasks: renumbered };
      });

      if (sync) {
        fireAndForget("deleteTask", deleteTaskRow(sync.supabase, taskId));
      }
    },
    [setState, sync],
  );

  const moveTask = useCallback(
    (taskId: string, toColumnId: string, toIndex: number) => {
      let renumberedRows:
        | { id: string; columnId: string; position: number }[]
        | null = null;
      let movedStatus: TaskStatus | null = null;

      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;

        const fromColumnId = task.columnId;
        const toColumn = prev.columns.find((c) => c.id === toColumnId);
        const newStatus: TaskStatus = toColumn?.status ?? task.status;
        movedStatus = newStatus;

        const without = prev.tasks.filter((t) => t.id !== taskId);
        const targetList = without
          .filter((t) => t.columnId === toColumnId)
          .sort((a, b) => a.position - b.position);

        const updatedTask: Task = {
          ...task,
          columnId: toColumnId,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        const clampedIndex = Math.max(0, Math.min(toIndex, targetList.length));
        targetList.splice(clampedIndex, 0, updatedTask);
        const reindexedTarget = reindexPositions(targetList);

        if (fromColumnId === toColumnId) {
          const others = without.filter((t) => t.columnId !== toColumnId);
          renumberedRows = reindexedTarget.map((t) => ({
            id: t.id,
            columnId: t.columnId,
            position: t.position,
          }));
          return { ...prev, tasks: [...others, ...reindexedTarget] };
        }

        const sourceList = without
          .filter((t) => t.columnId === fromColumnId)
          .sort((a, b) => a.position - b.position);
        const reindexedSource = reindexPositions(sourceList);
        const others = without.filter(
          (t) => t.columnId !== fromColumnId && t.columnId !== toColumnId,
        );

        renumberedRows = [
          ...reindexedSource.map((t) => ({
            id: t.id,
            columnId: t.columnId,
            position: t.position,
          })),
          ...reindexedTarget.map((t) => ({
            id: t.id,
            columnId: t.columnId,
            position: t.position,
          })),
        ];

        return {
          ...prev,
          tasks: [...others, ...reindexedSource, ...reindexedTarget],
        };
      });

      if (sync && renumberedRows) {
        fireAndForget(
          "moveTask",
          reindexTaskPositions(sync.supabase, renumberedRows),
        );
        if (movedStatus) {
          fireAndForget(
            "moveTask.status",
            updateTaskRow(sync.supabase, taskId, { status: movedStatus }),
          );
        }
      }
    },
    [setState, sync],
  );

  const addTimeLog = useCallback(
    (taskId: string, entry: Omit<TimeLogEntry, "id">) => {
      const newEntry: TimeLogEntry = { id: generateId(), ...entry };
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                timeLog: [...task.timeLog, newEntry],
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      }));

      if (sync) {
        fireAndForget(
          "addTimeLog",
          insertTimeLogRow(sync.supabase, sync.userId, taskId, newEntry),
        );
      }
    },
    [setState, sync],
  );

  const createColumn = useCallback(
    (name: string, status: TaskStatus = "todo"): Column => {
      let createdColumn: Column | null = null;
      setState((prev) => {
        const column: Column = {
          id: generateId(),
          name,
          status,
          position: prev.columns.length,
          isDefault: false,
        };
        createdColumn = column;
        return { ...prev, columns: [...prev.columns, column] };
      });

      const column = createdColumn!;
      if (sync) {
        fireAndForget(
          "createColumn",
          insertColumnRow(sync.supabase, sync.userId, column),
        );
      }
      return column;
    },
    [setState, sync],
  );

  const moveColumn = useCallback(
    (columnId: string, toIndex: number) => {
      let renumbered: { id: string; position: number }[] | null = null;

      setState((prev) => {
        const sorted = [...prev.columns].sort(
          (a, b) => a.position - b.position,
        );
        const fromIndex = sorted.findIndex((c) => c.id === columnId);
        if (fromIndex === -1) return prev;
        const clamped = Math.max(0, Math.min(toIndex, sorted.length - 1));
        if (fromIndex === clamped) return prev;
        const [moved] = sorted.splice(fromIndex, 1);
        sorted.splice(clamped, 0, moved);
        const next = sorted.map((c, i) => ({ ...c, position: i }));
        renumbered = next.map((c) => ({ id: c.id, position: c.position }));
        return { ...prev, columns: next };
      });

      if (sync && renumbered) {
        fireAndForget(
          "moveColumn",
          reindexColumnPositions(sync.supabase, renumbered),
        );
      }
    },
    [setState, sync],
  );

  const renameColumn = useCallback(
    (columnId: string, name: string) => {
      setState((prev) => ({
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === columnId ? { ...col, name } : col,
        ),
      }));

      if (sync) {
        fireAndForget(
          "renameColumn",
          updateColumnRow(sync.supabase, columnId, { name }),
        );
      }
    },
    [setState, sync],
  );

  const deleteColumn = useCallback(
    (columnId: string) => {
      let movedTaskIds: string[] = [];
      let fallbackId: string | null = null;
      let fallbackStatus: TaskStatus = "todo";

      setState((prev) => {
        const target = prev.columns.find((c) => c.id === columnId);
        if (!target) return prev;
        const fallback = prev.columns.find((c) => c.id !== columnId);
        if (!fallback) return prev;

        fallbackId = fallback.id;
        fallbackStatus = fallback.status;
        movedTaskIds = prev.tasks
          .filter((t) => t.columnId === columnId)
          .map((t) => t.id);

        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
          tasks: prev.tasks.map((t) =>
            t.columnId === columnId
              ? { ...t, columnId: fallback.id, status: fallback.status }
              : t,
          ),
        };
      });

      if (sync) {
        if (fallbackId && movedTaskIds.length > 0) {
          for (const id of movedTaskIds) {
            fireAndForget(
              "deleteColumn.reparent",
              updateTaskRow(sync.supabase, id, {
                column_id: fallbackId,
                status: fallbackStatus,
              }),
            );
          }
        }
        fireAndForget(
          "deleteColumn",
          deleteColumnRow(sync.supabase, columnId),
        );
      }
    },
    [setState, sync],
  );

  const createTag = useCallback(
    (name: string, color?: string): Tag => {
      let createdTag: Tag | null = null;
      setState((prev) => {
        const tag: Tag = {
          id: generateId(),
          name: name.trim(),
          color: color ?? TAG_PALETTE[prev.tags.length % TAG_PALETTE.length],
        };
        createdTag = tag;
        return { ...prev, tags: [...prev.tags, tag] };
      });

      const tag = createdTag!;
      if (sync) {
        fireAndForget(
          "createTag",
          insertTagRow(sync.supabase, sync.userId, tag),
        );
      }
      return tag;
    },
    [setState, sync],
  );

  const deleteTag = useCallback(
    (tagId: string) => {
      setState((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t.id !== tagId),
        tasks: prev.tasks.map((task) => ({
          ...task,
          tagIds: task.tagIds.filter((id) => id !== tagId),
        })),
      }));

      if (sync) {
        fireAndForget("deleteTag", deleteTagRow(sync.supabase, tagId));
      }
    },
    [setState, sync],
  );

  const columns = useMemo(
    () => [...state.columns].sort((a, b) => a.position - b.position),
    [state.columns],
  );

  const value: BoardContextValue = useMemo(
    () => ({
      state,
      columns,
      tasks: state.tasks,
      tags: state.tags,
      createTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      moveTask,
      addTimeLog,
      createColumn,
      renameColumn,
      deleteColumn,
      moveColumn,
      createTag,
      deleteTag,
    }),
    [
      state,
      columns,
      createTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      moveTask,
      addTimeLog,
      createColumn,
      renameColumn,
      deleteColumn,
      moveColumn,
      createTag,
      deleteTag,
    ],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}
