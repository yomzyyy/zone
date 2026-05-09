import type { TimerMode } from "@/shared/types";

// What the timer is currently doing
export type TimerState = "idle" | "running" | "paused" | "break" | "completed";

// Settings the user can configure in the settings modal
export interface TimerSettings {
  mode: TimerMode; // "stopwatch" or "pomodoro"
  focusDuration: number; // in minutes (default 25)
  breakDuration: number; // in minutes (default 5)
  soundEnabled: boolean;
}

// What gets saved to localStorage so the timer can survive refreshes
export interface TimerSession {
  startedAt: string; // ISO timestamp — when the timer was started
  mode: TimerMode;
  timerState: TimerState;
  pausedElapsed: number; // ms elapsed when paused (so we can resume accurately)
  taskId?: string; // optional task this session is logging time against
  pomodoroState?: {
    currentCycle: number; // which focus session we're on (1-4)
    isBreak: boolean; // are we in a break right now?
    focusDuration: number; // in ms
    breakDuration: number; // in ms
  };
}

// A completed session (for session history)
export interface CompletedSession {
  startedAt: string;
  endedAt: string;
  duration: number; // ms
  mode: TimerMode;
  completed: boolean; // false if user stopped early (abandoned)
  taskId?: string;
}
