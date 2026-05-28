"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { STORAGE_KEYS } from "../constants";
import type { TimerSession } from "../types";

export function ActiveTimerChip() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<TimerSession | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
      className="fixed top-3 right-3 z-40 inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-2.5 py-1 text-xs font-medium shadow-md backdrop-blur transition-colors hover:bg-accent sm:top-4 sm:right-4 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
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
