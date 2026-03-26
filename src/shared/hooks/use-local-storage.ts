"use client";

import { useState, useEffect } from "react";

// A custom hook that works like useState, but persists the value to localStorage.
// When the component mounts, it reads the saved value. When the value changes, it saves it.
//
// Usage: const [name, setName] = useLocalStorage("user-name", "Guest");
// This reads "user-name" from localStorage on load, defaults to "Guest" if not found.
//
// The <T> is a "generic" — it means this hook works with any type (string, number, object, etc.)
export function useLocalStorage<T>(key: string, initialValue: T) {
  // useState with a function ("lazy initial state") — the function only runs once on mount.
  // This avoids reading localStorage on every render (which would be slow).
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      // Server-side rendering: no localStorage available, use default
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // JSON.parse converts the stored string back to its original type
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If localStorage is corrupted or parsing fails, fall back to default
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // useEffect runs AFTER the component renders.
  // Whenever storedValue changes, we save it to localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
