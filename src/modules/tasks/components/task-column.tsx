"use client";

import { useState } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { Column, Tag, Task } from "../types";
import { TaskCard } from "./task-card";

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
  tags: Tag[];
  runningTaskId?: string | null;
  autoEditName?: boolean;
  onTaskClick: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onAddTask: (columnId: string, title: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function TaskColumn({
  column,
  tasks,
  tags,
  runningTaskId,
  autoEditName,
  onTaskClick,
  onToggleTaskComplete,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
}: TaskColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: column.id, data: { type: "column" } });

  const [draftTitle, setDraftTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingName, setEditingName] = useState(autoEditName ?? false);
  const [nameDraft, setNameDraft] = useState(column.name);

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) {
      setAdding(false);
      return;
    }
    onAddTask(column.id, title);
    setDraftTitle("");
    setAdding(false);
  }

  function handleNameSubmit() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== column.name) {
      onRenameColumn(column.id, trimmed);
    } else {
      setNameDraft(column.name);
    }
    setEditingName(false);
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-column
      {...attributes}
      className={cn(
        "flex w-72 shrink-0 cursor-default flex-col rounded-lg border bg-card/40 p-3 gap-3",
        isOver && "ring-2 ring-foreground/30",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
          aria-label={`Drag ${column.name} column`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {editingName ? (
          <Input
            value={nameDraft}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameSubmit();
              if (e.key === "Escape") {
                setNameDraft(column.name);
                setEditingName(false);
              }
            }}
            className="h-7 text-sm font-semibold flex-1"
          />
        ) : (
          <button
            type="button"
            className="flex-1 text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            onClick={() => setEditingName(true)}
          >
            {column.name}
          </button>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onDeleteColumn(column.id)}
            aria-label={`Delete ${column.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="scrollbar-subtle flex flex-1 flex-col gap-2 min-h-0 overflow-y-auto p-0.5 -m-0.5">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              tags={tags}
              isRunning={runningTaskId === task.id}
              onClick={() => onTaskClick(task)}
              onToggleComplete={onToggleTaskComplete}
            />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <form onSubmit={handleAddSubmit} className="shrink-0 space-y-2">
          <Input
            autoFocus
            placeholder="Task title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraftTitle("");
                setAdding(false);
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraftTitle("");
                setAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-4 w-4" />
          Add a card
        </Button>
      )}
    </div>
  );
}
