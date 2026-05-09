"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Play, Save, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { AUTH_ROUTES } from "@/modules/auth/constants";
import { useBoard } from "@/modules/tasks/hooks/use-board";
import { useSessions } from "./sessions-provider";
import { useTimer } from "../hooks/use-timer";
import { useTimerSettings } from "../hooks/use-timer-settings";
import { TimerDisplay } from "./timer-display";
import { TimerStatus } from "./timer-status";
import { TimerControls } from "./timer-controls";
import { TimerSettingsModal } from "./timer-settings";
import { SaveSessionPrompt } from "./save-session-prompt";

interface TimerPageProps {
  activeTaskId?: string | null;
  onClearActiveTask?: () => void;
}

export function TimerPage({ activeTaskId, onClearActiveTask }: TimerPageProps = {}) {
  const { settings, updateSettings } = useTimerSettings();
  const board = useBoard();
  const sessions = useSessions();
  const timer = useTimer(
    settings,
    activeTaskId ?? null,
    board.addTimeLog,
    sessions.addSession,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const taskTitle = useMemo(() => {
    if (!activeTaskId) return null;
    return board.tasks.find((t) => t.id === activeTaskId)?.title ?? null;
  }, [activeTaskId, board.tasks]);

  // Recovery prompt — shown when returning to a page with a running timer
  if (timer.showRecovery) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Card className="max-w-md p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Session in progress</h2>
          <p className="text-muted-foreground">
            You had a timer running. What would you like to do?
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={timer.resumeRecoveredSession} className="gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>
            <Button
              variant="secondary"
              onClick={timer.saveRecoveredSession}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save session
            </Button>
            <Button
              variant="ghost"
              onClick={timer.dismissRecovery}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Discard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      {/* Active task banner */}
      {activeTaskId && taskTitle && (
        <div className="flex items-center gap-2 rounded-full border bg-card/40 px-4 py-1.5 text-sm">
          <span className="text-muted-foreground">Working on:</span>
          <span className="font-medium">{taskTitle}</span>
          {onClearActiveTask && (
            <button
              type="button"
              onClick={onClearActiveTask}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear active task"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Pomodoro cycle indicator */}
      {settings.mode === "pomodoro" && timer.timerState !== "idle" && (
        <div className="text-sm text-muted-foreground">
          {timer.isBreak ? "Break" : `Focus — Cycle ${timer.currentCycle}`}
        </div>
      )}

      {/* Timer display */}
      <TimerDisplay
        elapsed={timer.elapsed}
        remaining={timer.remaining}
        mode={settings.mode}
      />

      {/* Status text */}
      <TimerStatus
        timerState={timer.timerState}
        elapsed={timer.elapsed}
        currentCycle={timer.currentCycle}
      />

      {/* Controls */}
      <TimerControls
        timerState={timer.timerState}
        onStart={timer.start}
        onPause={timer.pause}
        onStop={timer.stop}
        onReset={timer.reset}
        onSkipBreak={timer.skipBreak}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings modal */}
      <TimerSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <SaveSessionPrompt
        prompt={timer.pendingSavePrompt}
        onConfirm={timer.confirmSaveSession}
        onDismiss={timer.dismissSavePrompt}
      />

      {/* Sign-up nudge for guests */}
      {!isAuthenticated && (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link
            href={AUTH_ROUTES.SIGNUP}
            className="underline hover:text-foreground"
          >
            Sign up
          </Link>{" "}
          to save your sessions and unlock all features
        </p>
      )}
    </div>
  );
}
