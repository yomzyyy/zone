"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/shared/components/layout/navbar";
import { TimerPage } from "@/modules/timer/components/timer-page";
import { Board } from "@/modules/tasks/components/board";
import { Calendar } from "@/modules/calendar/components/calendar";
import { Stats } from "@/modules/analytics/components/stats";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { useBoard } from "@/modules/tasks/hooks/use-board";
import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import { cn } from "@/shared/utils/utils";
import type { TabId } from "@/shared/constants";

const ACTIVE_TASK_KEY = "zone-active-task-id";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("focus");
  const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>(
    ACTIVE_TASK_KEY,
    null,
  );
  const { isAuthenticated } = useAuth();
  const board = useBoard();

  function handleEnterZone(taskId: string) {
    if (activeTaskId && activeTaskId !== taskId) {
      const currentTitle =
        board.tasks.find((t) => t.id === activeTaskId)?.title ?? null;
      const message = currentTitle
        ? `Switched from "${currentTitle}". Stop the timer first if you want to keep that session.`
        : "Replaced the previous active task.";
      toast(message);
    }
    setActiveTaskId(taskId);
    setActiveTab("focus");
  }

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 min-h-0">
        {/* TimerPage stays mounted across tabs so the timer keeps ticking
            even while you browse Tasks/Calendar. Hidden via display:none
            when not active. */}
        <div
          className={cn(
            "flex flex-1 min-h-0",
            activeTab !== "focus" && "hidden",
          )}
        >
          <TimerPage
            activeTaskId={activeTaskId}
            onClearActiveTask={() => setActiveTaskId(null)}
          />
        </div>

        {activeTab === "tasks" && (
          <AuthGuard feature="Tasks" isAuthenticated={isAuthenticated}>
            <Board
              runningTaskId={activeTaskId}
              onEnterZone={handleEnterZone}
            />
          </AuthGuard>
        )}

        {activeTab === "calendar" && (
          <AuthGuard feature="Calendar" isAuthenticated={isAuthenticated}>
            <Calendar
              runningTaskId={activeTaskId}
              onEnterZone={handleEnterZone}
            />
          </AuthGuard>
        )}

        {activeTab === "stats" && (
          <AuthGuard feature="Stats" isAuthenticated={isAuthenticated}>
            <Stats />
          </AuthGuard>
        )}
      </div>
    </>
  );
}
