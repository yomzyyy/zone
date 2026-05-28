"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { RichTextEditor } from "@/shared/components/ui/rich-text-editor";
import { PRIORITY_LABELS, PRIORITY_ORDER } from "../constants";
import type { Priority, Tag, Task } from "../types";
import { formatDuration, totalSeconds } from "../utils";
import { TagInput } from "./tag-input";

interface TaskEditModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTags: Tag[];
  onSave: (
    taskId: string,
    updates: {
      title: string;
      note: string;
      dueDate: string | null;
      priority: Priority;
      tagIds: string[];
    },
  ) => void;
  onDelete: (taskId: string) => void;
  onCreateTag: (name: string, color: string) => Tag;
  onEnterZone?: (taskId: string) => void;
  isRunning?: boolean;
}

export function TaskEditModal({
  task,
  open,
  onOpenChange,
  allTags,
  onSave,
  onDelete,
  onCreateTag,
  onEnterZone,
  isRunning,
}: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    if (!task) return;
    const raf = requestAnimationFrame(() => {
      const el = titleRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
    return () => cancelAnimationFrame(raf);
  }, [task]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note);
      setDueDate(task.dueDate ?? "");
      setPriority(task.priority);
      setTagIds(task.tagIds);
    }
  }, [task]);

  if (!task) return null;

  function handleSave() {
    if (!task) return;
    onSave(task.id, {
      title: title.trim() || task.title,
      note,
      dueDate: dueDate || null,
      priority,
      tagIds,
    });
    onOpenChange(false);
  }

  function handleDelete() {
    if (!task) return;
    onDelete(task.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription className="sr-only">
            Edit task title, note, due date, priority, and tags. View time log and start a focus session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-w-0">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="task-title" className="text-xs uppercase tracking-wide">
              Title
            </Label>
            <textarea
              ref={titleRef}
              id="task-title"
              rows={1}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="block w-full min-w-0 max-w-full resize-none break-all rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-note" className="text-xs uppercase tracking-wide">
              Note
            </Label>
            <RichTextEditor
              id="task-note"
              placeholder="Enter details..."
              value={note}
              onChange={setNote}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-due" className="text-xs uppercase tracking-wide">
                Date
              </Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Tags</Label>
            <TagInput
              allTags={allTags}
              selectedTagIds={tagIds}
              onAdd={onCreateTag}
              onAttach={(id) => setTagIds((prev) => [...prev, id])}
              onDetach={(id) =>
                setTagIds((prev) => prev.filter((t) => t !== id))
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Time log</Label>
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1 max-h-40 overflow-y-auto">
              {task.timeLog.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No sessions yet
                </p>
              ) : (
                task.timeLog
                  .slice()
                  .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
                  .map((entry) => {
                    const start = new Date(entry.startedAt);
                    return (
                      <div
                        key={entry.id}
                        className="flex justify-between text-xs"
                      >
                        <span>{start.toLocaleString()}</span>
                        <span className="font-mono">
                          {formatDuration(entry.durationSeconds)}
                        </span>
                      </div>
                    );
                  })
              )}
              <div className="flex justify-between border-t pt-1 text-xs font-medium">
                <span>Total</span>
                <span className="font-mono">
                  {formatDuration(totalSeconds(task))}
                </span>
              </div>
            </div>
          </div>

          {onEnterZone && (
            <Button
              type="button"
              className="w-full"
              variant={isRunning ? "secondary" : "default"}
              onClick={() => {
                onEnterZone(task.id);
                onOpenChange(false);
              }}
            >
              {isRunning ? "Currently in zone" : "⚡ Enter Zone"}
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete task
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
