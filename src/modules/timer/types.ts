import type { TimerMode } from "@/shared/types";

export type TimerState = "idle" | "running" | "paused" | "break" | "completed";

export interface TimerSettings {
  mode: TimerMode;
  focusDuration: number;
  breakDuration: number;
  cyclesTarget: number;
  soundEnabled: boolean;
}

export interface TimerSession {
  startedAt: string;
  mode: TimerMode;
  timerState: TimerState;
  pausedElapsed: number;
  taskId?: string;
  pausedByClose?: boolean;
  pomodoroState?: {
    currentCycle: number;
    isBreak: boolean;
    focusDuration: number;
    breakDuration: number;
  };
}

export interface CompletedSession {
  startedAt: string;
  endedAt: string;
  duration: number;
  mode: TimerMode;
  completed: boolean;
  taskId?: string;
}
