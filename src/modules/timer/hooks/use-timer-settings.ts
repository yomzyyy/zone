"use client";

import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import { DEFAULT_TIMER_SETTINGS, STORAGE_KEYS } from "../constants";
import type { TimerSettings } from "../types";

export function useTimerSettings() {
  const [rawSettings, setSettings] = useLocalStorage<TimerSettings>(
    STORAGE_KEYS.TIMER_SETTINGS,
    DEFAULT_TIMER_SETTINGS
  );

  const settings: TimerSettings = { ...DEFAULT_TIMER_SETTINGS, ...rawSettings };

  const updateSettings = (updates: Partial<TimerSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
