"use client";

import { Play, Pause, Square, RotateCcw, SkipForward, Settings } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { TimerState } from "../types";

interface TimerControlsProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSkipBreak: () => void;
  onOpenSettings: () => void;
}

// The action buttons below the timer.
export function TimerControls({
  timerState,
  onStart,
  onPause,
  onStop,
  onReset,
  onSkipBreak,
  onOpenSettings,
}: TimerControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Main action button — changes based on state */}
      {timerState === "running" ? (
        <Button size="lg" onClick={onPause} className="gap-2 px-8">
          <Pause className="h-5 w-5" />
          Pause
        </Button>
      ) : timerState === "paused" ? (
        <>
          <Button size="lg" onClick={onStart} className="gap-2 px-8">
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button size="lg" variant="destructive" onClick={onStop} className="gap-2">
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </>
      ) : timerState === "break" ? (
        <Button size="lg" onClick={onSkipBreak} className="gap-2 px-8">
          <SkipForward className="h-5 w-5" />
          Skip Break
        </Button>
      ) : (
        <Button size="lg" onClick={onStart} className="gap-2 px-8">
          <Play className="h-5 w-5" />
          Start
        </Button>
      )}

      {/* Reset — only show when there's something to reset */}
      {timerState === "paused" && (
        <Button size="lg" variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      )}

      {/* Settings — always visible but disabled when running */}
      <Button
        size="lg"
        variant="outline"
        onClick={onOpenSettings}
        disabled={timerState === "running" || timerState === "break"}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}
