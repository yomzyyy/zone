"use client";

import { useState } from "react";
import { Play, Save, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { useTimer } from "../hooks/use-timer";
import { useTimerSettings } from "../hooks/use-timer-settings";
import { TimerDisplay } from "./timer-display";
import { TimerStatus } from "./timer-status";
import { TimerControls } from "./timer-controls";
import { TimerSettingsModal } from "./timer-settings";

// The main timer page — composes all timer components together.
export function TimerPage() {
  const { settings, updateSettings } = useTimerSettings();
  const timer = useTimer(settings);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    </div>
  );
}
