"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { STORAGE_KEYS } from "../constants";
import type { TimerSession } from "../types";

// Floating chip shown on every page (except the home page, where the full
// timer is already visible) when there's a running or paused session. Lets
// users navigate the app without losing sight of the running timer.
export function ActiveTimerChip() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<TimerSession | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Read the session from localStorage and re-read every second. Cheap because
  // the chip exists for at most a few minutes per session, and avoids needing
  // a context to share state with the timer hook.
  useEffect(() => {
    function read() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        setSession(raw ? (JSON.parse(raw) as TimerSession) : null);
      } catch {
        setSession(null);
      }
    }
    read();
    const id = setInterval(() => {
      read();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!session) return null;
  if (pathname === "/") return null;

  const startedAt = new Date(session.startedAt).getTime();
  const elapsedMs =
    session.timerState === "paused"
      ? session.pausedElapsed
      : session.pausedElapsed + (now - startedAt);
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const display =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;

  const isPaused = session.timerState === "paused";
  const isBreak = session.pomodoroState?.isBreak;

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="fixed top-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-sm font-medium shadow-md backdrop-blur transition-colors hover:bg-accent"
      aria-label="Return to timer"
    >
      <Clock
        className={`h-3.5 w-3.5 ${isPaused ? "text-muted-foreground" : "text-foreground"}`}
      />
      <span className="tabular-nums">{display}</span>
      <span className="text-xs text-muted-foreground">
        {isPaused ? "Paused" : isBreak ? "Break" : "Focus"}
      </span>
    </button>
  );
}
