"use client";

import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import { DEFAULT_TIMER_SETTINGS, STORAGE_KEYS } from "../constants";
import type { TimerSettings } from "../types";

// Custom hook to manage timer settings with localStorage persistence.
export function useTimerSettings() {
  const [settings, setSettings] = useLocalStorage<TimerSettings>(
    STORAGE_KEYS.TIMER_SETTINGS,
    DEFAULT_TIMER_SETTINGS
  );

  const updateSettings = (updates: Partial<TimerSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
