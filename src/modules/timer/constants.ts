import type { TimerSettings } from "./types";

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  mode: "stopwatch",
  focusDuration: 25,
  breakDuration: 5,
  cyclesTarget: 4,
  soundEnabled: true,
};

export const STORAGE_KEYS = {
  TIMER_SETTINGS: "zone-timer-settings",
  ACTIVE_SESSION: "zone-active-session",
  COMPLETED_SESSIONS: "zone-completed-sessions",
} as const;
