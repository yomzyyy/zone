import type { TimerSettings } from "./types";

// Default settings — these are the initial values before the user changes anything
export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  mode: "stopwatch",
  focusDuration: 25,
  breakDuration: 5,
  soundEnabled: true,
};

// localStorage keys — centralized so we don't have typos across files
export const STORAGE_KEYS = {
  TIMER_SETTINGS: "zone-timer-settings",
  ACTIVE_SESSION: "zone-active-session",
  COMPLETED_SESSIONS: "zone-completed-sessions",
} as const;
