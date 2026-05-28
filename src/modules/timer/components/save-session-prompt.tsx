"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatDuration } from "@/modules/tasks/utils";
import { useBoard } from "@/modules/tasks/hooks/use-board";
import type { Priority } from "@/modules/tasks/types";
import type { PendingSavePrompt } from "../hooks/use-timer";

interface SaveSessionPromptProps {
  prompt: PendingSavePrompt | null;
  onConfirm: (taskId: string) => void;
  onDismiss: () => void;
}

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function SaveSessionPrompt({
  prompt,
  onConfirm,
  onDismiss,
}: SaveSessionPromptProps) {
  const board = useBoard();
  const [showPicker, setShowPicker] = useState(false);
  const [pickedTaskId, setPickedTaskId] = useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");

  useEffect(() => {
    if (prompt) {
      setShowPicker(false);
      setPickedTaskId("");
      setNewTaskTitle("");
    }
  }, [prompt]);

  function handlePickTask(value: string) {
    setPickedTaskId(value);
    if (value) setNewTaskTitle("");
  }
  function handleNewTitleChange(value: string) {
    setNewTaskTitle(value);
    if (value.trim()) setPickedTaskId("");
  }

  function handleSave() {
    const trimmed = newTaskTitle.trim();
    if (trimmed) {
      const created = board.createTask({ title: trimmed });
      onConfirm(created.id);
      return;
    }
    if (pickedTaskId) onConfirm(pickedTaskId);
  }

  const canSave = Boolean(pickedTaskId) || newTaskTitle.trim().length > 0;

  const sortedOpenTasks = useMemo(
    () =>
      board.tasks
        .filter((t) => !t.completed)
        .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]),
    [board.tasks],
  );

  const open = prompt !== null;
  const seconds = prompt ? Math.round(prompt.durationMs / 1000) : 0;
  const durationLabel = formatDuration(seconds);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {showPicker ? "Choose a task" : "Save time to a task?"}
          </DialogTitle>
          <DialogDescription>
            {showPicker
              ? `Pick the task to log ${durationLabel} against.`
              : `You tracked ${durationLabel} without an assigned task. Want to save it?`}
          </DialogDescription>
        </DialogHeader>

        {showPicker && (
          <div className="space-y-3 py-2">
            {sortedOpenTasks.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="save-pick-existing">Existing task</Label>
                <Select value={pickedTaskId} onValueChange={handlePickTask}>
                  <SelectTrigger id="save-pick-existing" className="w-full">
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedOpenTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sortedOpenTasks.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="save-new-task">
                {sortedOpenTasks.length === 0
                  ? "Name your task"
                  : "Create a new task"}
              </Label>
              <Input
                id="save-new-task"
                placeholder="What were you working on?"
                value={newTaskTitle}
                onChange={(e) => handleNewTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSave) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {showPicker ? (
            <>
              <Button variant="ghost" onClick={() => setShowPicker(false)}>
                Back
              </Button>
              <Button disabled={!canSave} onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onDismiss}>
                No, discard
              </Button>
              <Button onClick={() => setShowPicker(true)}>Yes, save</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
