"use client";

import { useState, useEffect } from "react";

// A custom hook that works like useState, but persists the value to localStorage.
//
// Usage: const [name, setName] = useLocalStorage("user-name", "Guest");
//
// SSR-safe: starts with `initialValue` on both server and client to prevent
// hydration mismatches, then upgrades to the stored value after mount.
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Read the saved value once after mount (client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setHydrated(true);
  }, [key]);

  // Write to localStorage when the value changes — but only after the initial
  // read has finished, otherwise we'd overwrite the saved value with the default.
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue, hydrated]);

  return [storedValue, setStoredValue] as const;
}
