"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatTime, minutesToMs } from "../utils";
import { STORAGE_KEYS } from "../constants";
import type { TimerSession } from "../types";

const DEFAULT_TITLE = "Zone — Flow Timer & Task Manager";

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

  useEffect(() => {
    if (timer.timerState === "idle") {
      document.title = DEFAULT_TITLE;
      return;
    }

    function computeAndSet() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        if (!raw) return;
        const sess = JSON.parse(raw) as TimerSession;
        const startedAt = new Date(sess.startedAt).getTime();
        const elapsedMs =
          sess.timerState === "paused"
            ? sess.pausedElapsed
            : sess.pausedElapsed + (Date.now() - startedAt);

        const isBreak = sess.pomodoroState?.isBreak ?? false;
        let displayMs = elapsedMs;
        if (settings.mode === "pomodoro") {
          const target = isBreak
            ? minutesToMs(settings.breakDuration)
            : minutesToMs(settings.focusDuration);
          displayMs = Math.max(0, target - elapsedMs);
        }

        const time = formatTime(displayMs);
        const phase =
          sess.timerState === "paused"
            ? "Paused"
            : isBreak
              ? "Break"
              : "Focus";
        document.title = `${time} · ${phase} — Zone`;
      } catch {
      }
    }

    computeAndSet();
    const id = window.setInterval(computeAndSet, 1000);
    return () => {
      window.clearInterval(id);
      document.title = DEFAULT_TITLE;
    };
  }, [
    timer.timerState,
    settings.mode,
    settings.focusDuration,
    settings.breakDuration,
  ]);

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

      {settings.mode === "pomodoro" && timer.timerState !== "idle" && (
        <div className="text-sm text-muted-foreground">
          {timer.isBreak
            ? `Break — Cycle ${timer.currentCycle} of ${settings.cyclesTarget}`
            : `Focus — Cycle ${timer.currentCycle} of ${settings.cyclesTarget}`}
        </div>
      )}

      <TimerDisplay
        elapsed={timer.elapsed}
        remaining={timer.remaining}
        mode={settings.mode}
      />

      <TimerStatus
        timerState={timer.timerState}
        elapsed={timer.elapsed}
        currentCycle={timer.currentCycle}
      />

      <TimerControls
        timerState={timer.timerState}
        onStart={timer.start}
        onPause={timer.pause}
        onStop={timer.stop}
        onReset={timer.reset}
        onSkipBreak={timer.skipBreak}
        onOpenSettings={() => setSettingsOpen(true)}
      />

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
