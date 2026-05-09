"use client";

import { useState } from "react";
import { useBoard } from "@/modules/tasks/hooks/use-board";
import { TaskEditModal } from "@/modules/tasks/components/task-edit-modal";
import type { Task } from "@/modules/tasks/types";
import { useCalendar } from "../hooks/use-calendar";
import { CalendarHeader } from "./calendar-header";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";

interface CalendarProps {
  runningTaskId?: string | null;
  onEnterZone?: (taskId: string) => void;
}

export function Calendar({ runningTaskId, onEnterZone }: CalendarProps) {
  const board = useBoard();
  const calendar = useCalendar("month");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  function handleSelectTask(task: Task) {
    setEditingTask(task);
  }

  function handleCreateTaskOnDate(dateIso: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    board.createTask({ title: trimmed, dueDate: dateIso });
  }

  function handleSelectDate(date: Date) {
    calendar.setReference(new Date(date));
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
      <CalendarHeader
        view={calendar.view}
        reference={calendar.reference}
        onPrev={calendar.prev}
        onNext={calendar.next}
        onToday={calendar.today}
        onChangeView={calendar.setView}
        onSelectDate={handleSelectDate}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {calendar.view === "month" && (
          <MonthView
            reference={calendar.reference}
            tasks={board.tasks}
            tags={board.tags}
            onSelectTask={handleSelectTask}
            onCreateTaskOnDate={handleCreateTaskOnDate}
          />
        )}
        {calendar.view === "week" && (
          <WeekView
            reference={calendar.reference}
            tasks={board.tasks}
            tags={board.tags}
            onSelectTask={handleSelectTask}
            onCreateTaskOnDate={handleCreateTaskOnDate}
          />
        )}
      </div>

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
