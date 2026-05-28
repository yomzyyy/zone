"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/utils";
import { useBoard } from "../hooks/use-board";
import type { Tag, Task } from "../types";
import { tasksInColumn } from "../utils";
import { TagChip } from "./tag-chip";
import { TaskCard } from "./task-card";
import { TaskColumn } from "./task-column";
import { TaskEditModal } from "./task-edit-modal";

interface BoardProps {
  runningTaskId?: string | null;
  onEnterZone?: (taskId: string) => void;
}

export function Board({ runningTaskId, onEnterZone }: BoardProps) {
  const board = useBoard();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [justCreatedColumnId, setJustCreatedColumnId] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ startX: number; startScrollLeft: number } | null>(
    null,
  );

  function handlePanPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(
        "button, input, textarea, a, [role='button'], [data-task-card]",
      )
    )
      return;
    if (!scrollRef.current) return;
    scrollRef.current.setPointerCapture(e.pointerId);
    panState.current = {
      startX: e.clientX,
      startScrollLeft: scrollRef.current.scrollLeft,
    };
  }

  function handlePanPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!panState.current || !scrollRef.current) return;
    const deltaX = e.clientX - panState.current.startX;
    scrollRef.current.scrollLeft = panState.current.startScrollLeft - deltaX;
  }

  function handlePanPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!panState.current || !scrollRef.current) return;
    scrollRef.current.releasePointerCapture(e.pointerId);
    panState.current = null;
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.deltaY === 0) return;

    let el = e.target as HTMLElement | null;
    while (el && el !== scrollRef.current) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const canScrollY =
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight;
      if (canScrollY) return;
      el = el.parentElement;
    }

    scrollRef.current.scrollLeft += e.deltaY;
  }

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return board.tasks.filter((task) => {
      if (tagFilter.length > 0) {
        const hasAll = tagFilter.every((id) => task.tagIds.includes(id));
        if (!hasAll) return false;
      }
      if (!query) return true;
      if (task.title.toLowerCase().includes(query)) return true;
      if (task.note.toLowerCase().includes(query)) return true;
      const matchedTagNames = board.tags
        .filter((t) => task.tagIds.includes(t.id))
        .some((t) => t.name.toLowerCase().includes(query));
      return matchedTagNames;
    });
  }, [board.tasks, board.tags, search, tagFilter]);

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "column") return;
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (active.data.current?.type === "column") {
      const toIndex = board.columns.findIndex((c) => c.id === overId);
      if (toIndex !== -1) {
        board.moveColumn(activeId, toIndex);
      }
      return;
    }

    const activeTask = board.tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overIsColumn = board.columns.some((c) => c.id === overId);
    const targetColumnId = overIsColumn
      ? overId
      : board.tasks.find((t) => t.id === overId)?.columnId;

    if (!targetColumnId) return;

    const targetTasks = tasksInColumn(board.tasks, targetColumnId).filter(
      (t) => t.id !== activeId,
    );

    let newIndex = targetTasks.length;
    if (!overIsColumn) {
      const overIndex = targetTasks.findIndex((t) => t.id === overId);
      if (overIndex !== -1) {
        newIndex = overIndex;
      }
    }

    board.moveTask(activeId, targetColumnId, newIndex);
  }

  function handleAddColumn() {
    const col = board.createColumn("New column");
    setJustCreatedColumnId(col.id);
  }

  const activeTask = activeTaskId
    ? board.tasks.find((t) => t.id === activeTaskId)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 min-h-0 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleAddColumn}>
          <Plus className="h-4 w-4" />
          Add column
        </Button>
        <div className="relative w-full sm:flex-1 sm:max-w-sm sm:ml-auto">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className={cn("pl-8", search && "pr-8")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {tagFilter.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtering by:</span>
          {tagFilter.map((id) => {
            const tag = board.tags.find((t) => t.id === id);
            if (!tag) return null;
            return (
              <TagChip
                key={tag.id}
                tag={tag}
                onRemove={() =>
                  setTagFilter((prev) => prev.filter((t) => t !== id))
                }
              />
            );
          })}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTagFilter([])}
            className="h-7"
          >
            Clear
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollRef}
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          onPointerCancel={handlePanPointerUp}
          onWheel={handleWheel}
          className="scrollbar-subtle flex flex-1 min-h-0 min-w-0 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
        >
          <SortableContext
            items={board.columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="mx-auto flex gap-3">
              {board.columns.map((column) => (
                <TaskColumn
                  key={column.id}
                  column={column}
                  tasks={tasksInColumn(filteredTasks, column.id)}
                  tags={board.tags}
                  runningTaskId={runningTaskId}
                  autoEditName={column.id === justCreatedColumnId}
                  onTaskClick={(task) => setEditingTask(task)}
                  onToggleTaskComplete={board.toggleTaskComplete}
                  onAddTask={(columnId, title) =>
                    board.createTask({ columnId, title })
                  }
                  onRenameColumn={(id, name) => {
                    board.renameColumn(id, name);
                    if (id === justCreatedColumnId) setJustCreatedColumnId(null);
                  }}
                  onDeleteColumn={board.deleteColumn}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 rotate-1">
              <TaskCard task={activeTask} tags={board.tags} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskEditModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        allTags={board.tags}
        onSave={(taskId, updates) => board.updateTask(taskId, updates)}
        onDelete={board.deleteTask}
        onCreateTag={(name, color) => board.createTag(name, color)}
        onEnterZone={onEnterZone}
        isRunning={editingTask ? runningTaskId === editingTask.id : false}
      />
    </div>
  );
}
