"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import { STORAGE_KEYS } from "../constants";
import { minutesToMs } from "../utils";
import type {
  TimerState,
  TimerSession,
  TimerSettings,
  CompletedSession,
} from "../types";
import type { TimerMode } from "@/shared/types";

export interface TimerLogEntry {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

export type LogTimeCallback = (taskId: string, entry: TimerLogEntry) => void;

export type SessionCompleteCallback = (session: CompletedSession) => void;

export interface PendingSavePrompt {
  startedAt: string;
  endedAt: string;
  durationMs: number;
  mode: TimerMode;
}

function playNotificationSound() {
  try {
    const audioContext = new AudioContext();
    const beepCount = 3;
    const beepDuration = 0.18;
    const beepGap = 0.22;

    for (let i = 0; i < beepCount; i++) {
      const startAt = audioContext.currentTime + i * (beepDuration + beepGap);
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + beepDuration);

      oscillator.start(startAt);
      oscillator.stop(startAt + beepDuration);
    }

    const totalDuration = beepCount * beepDuration + (beepCount - 1) * beepGap;
    setTimeout(() => audioContext.close(), Math.ceil(totalDuration * 1000) + 100);
  } catch {
  }
}

export function useTimer(
  settings: TimerSettings,
  activeTaskId?: string | null,
  onLogTime?: LogTimeCallback,
  onSessionComplete?: SessionCompleteCallback,
) {
  const activeTaskIdRef = useRef<string | null>(activeTaskId ?? null);
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId ?? null;
  }, [activeTaskId]);

  const onLogTimeRef = useRef(onLogTime);
  useEffect(() => {
    onLogTimeRef.current = onLogTime;
  }, [onLogTime]);

  const onSessionCompleteRef = useRef(onSessionComplete);
  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [pendingSavePrompt, setPendingSavePrompt] =
    useState<PendingSavePrompt | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);

  const timerStateRef = useRef<TimerState>("idle");
  const isBreakRef = useRef(false);
  const currentCycleRef = useRef(1);
  const elapsedRef = useRef(0);
  const settingsRef = useRef(settings);

  useEffect(() => { timerStateRef.current = timerState; }, [timerState]);
  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);
  useEffect(() => { currentCycleRef.current = currentCycle; }, [currentCycle]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const [activeSession, setActiveSession] =
    useLocalStorage<TimerSession | null>(STORAGE_KEYS.ACTIVE_SESSION, null);

  const getTargetDuration = useCallback(() => {
    const s = settingsRef.current;
    return minutesToMs(isBreakRef.current ? s.breakDuration : s.focusDuration);
  }, []);

  const targetDuration = minutesToMs(
    isBreak ? settings.breakDuration : settings.focusDuration,
  );

  const remaining =
    settings.mode === "pomodoro" ? Math.max(0, targetDuration - elapsed) : 0;

  const stopTicking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const persistSession = useCallback(
    (args: {
      startedAt: string;
      endedAt: string;
      durationMs: number;
      taskId?: string;
      completed: boolean;
      mode: TimerMode;
    }) => {
      const session: CompletedSession = {
        startedAt: args.startedAt,
        endedAt: args.endedAt,
        duration: args.durationMs,
        mode: args.mode,
        completed: args.completed,
        taskId: args.taskId,
      };
      onSessionCompleteRef.current?.(session);

      if (args.taskId && onLogTimeRef.current) {
        onLogTimeRef.current(args.taskId, {
          startedAt: args.startedAt,
          endedAt: args.endedAt,
          durationSeconds: Math.round(args.durationMs / 1000),
        });
      }
    },
    [],
  );

  const saveCompletedSession = useCallback(
    (completed: boolean) => {
      const currentElapsed = elapsedRef.current;
      if (currentElapsed < 1000) return;
      persistSession({
        startedAt: new Date(Date.now() - currentElapsed).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: currentElapsed,
        taskId: activeTaskIdRef.current ?? undefined,
        completed,
        mode: settingsRef.current.mode,
      });
    },
    [persistSession],
  );

  const handlePhaseComplete = useCallback(() => {
    stopTicking();

    if (settingsRef.current.soundEnabled) {
      playNotificationSound();
    }

    if (isBreakRef.current) {
      setIsBreak(false);
      setElapsed(0);
      pausedElapsedRef.current = 0;
      setTimerState("idle");
      setActiveSession(null);
    } else {
      const justFinishedCycle = currentCycleRef.current;
      const cyclesTarget = settingsRef.current.cyclesTarget;
      saveCompletedSession(true);
      if (justFinishedCycle >= cyclesTarget) {
        setElapsed(0);
        pausedElapsedRef.current = 0;
        setCurrentCycle(1);
        setIsBreak(false);
        setTimerState("idle");
        setActiveSession(null);
        return;
      }

      const nextCycle = justFinishedCycle + 1;
      setCurrentCycle(nextCycle);
      setIsBreak(true);
      setElapsed(0);
      pausedElapsedRef.current = 0;
      setTimerState("break");

      startTimeRef.current = Date.now();
      const tickFn = () => {
        if (startTimeRef.current === null) return;
        const newElapsed = Date.now() - startTimeRef.current;
        setElapsed(newElapsed);

        const s = settingsRef.current;
        const breakDur = minutesToMs(s.breakDuration);
        if (newElapsed >= breakDur) {
          cancelAnimationFrame(animationFrameRef.current!);
          animationFrameRef.current = null;
          startTimeRef.current = null;
          if (s.soundEnabled) playNotificationSound();
          setIsBreak(false);
          setElapsed(0);
          pausedElapsedRef.current = 0;
          setTimerState("idle");
          setActiveSession(null);
          return;
        }
        animationFrameRef.current = requestAnimationFrame(tickFn);
      };
      animationFrameRef.current = requestAnimationFrame(tickFn);

      setActiveSession({
        startedAt: new Date().toISOString(),
        mode: "pomodoro",
        timerState: "break",
        pausedElapsed: 0,
        pomodoroState: {
          currentCycle: nextCycle,
          isBreak: true,
          focusDuration: minutesToMs(settingsRef.current.focusDuration),
          breakDuration: minutesToMs(settingsRef.current.breakDuration),
        },
      });
    }
  }, [stopTicking, saveCompletedSession, setActiveSession]);

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;

    const now = Date.now();
    const newElapsed = pausedElapsedRef.current + (now - startTimeRef.current);
    setElapsed(newElapsed);

    if (settingsRef.current.mode === "pomodoro") {
      const target = getTargetDuration();
      if (newElapsed >= target) {
        handlePhaseComplete();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [getTargetDuration, handlePhaseComplete]);

  const startTicking = useCallback(() => {
    startTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const start = useCallback(() => {
    const currentState = timerStateRef.current;
    const s = settingsRef.current;

    pausedElapsedRef.current = currentState === "paused" ? elapsedRef.current : 0;
    if (currentState !== "paused") {
      setElapsed(0);
      setCurrentCycle(1);
      setIsBreak(false);
    }

    setTimerState("running");
    startTicking();

    setActiveSession({
      startedAt: new Date().toISOString(),
      mode: s.mode,
      timerState: "running",
      pausedElapsed: pausedElapsedRef.current,
      taskId: activeTaskIdRef.current ?? undefined,
      pomodoroState:
        s.mode === "pomodoro"
          ? {
              currentCycle: currentCycleRef.current,
              isBreak: isBreakRef.current,
              focusDuration: minutesToMs(s.focusDuration),
              breakDuration: minutesToMs(s.breakDuration),
            }
          : undefined,
    });
  }, [startTicking, setActiveSession]);

  const pause = useCallback(() => {
    stopTicking();
    const currentElapsed = elapsedRef.current;
    pausedElapsedRef.current = currentElapsed;
    setTimerState("paused");

    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            timerState: "paused",
            pausedElapsed: currentElapsed,
            pausedByClose: false,
          }
        : null,
    );
  }, [stopTicking, setActiveSession]);

  const stop = useCallback(() => {
    stopTicking();
    const currentElapsed = elapsedRef.current;
    const taskId = activeTaskIdRef.current;
    const mode = settingsRef.current.mode;

    setActiveSession(null);
    setTimerState("idle");
    setElapsed(0);
    pausedElapsedRef.current = 0;
    setCurrentCycle(1);
    setIsBreak(false);

    if (currentElapsed < 1000) return;

    const startedAt = new Date(Date.now() - currentElapsed).toISOString();
    const endedAt = new Date().toISOString();

    if (taskId) {
      persistSession({
        startedAt,
        endedAt,
        durationMs: currentElapsed,
        taskId,
        completed: false,
        mode,
      });
    } else {
      setPendingSavePrompt({ startedAt, endedAt, durationMs: currentElapsed, mode });
    }
  }, [stopTicking, persistSession, setActiveSession]);

  const pendingSavePromptRef = useRef<PendingSavePrompt | null>(null);
  useEffect(() => {
    pendingSavePromptRef.current = pendingSavePrompt;
  }, [pendingSavePrompt]);

  const confirmSaveSession = useCallback(
    (taskId: string) => {
      const current = pendingSavePromptRef.current;
      if (!current) return;
      persistSession({
        startedAt: current.startedAt,
        endedAt: current.endedAt,
        durationMs: current.durationMs,
        taskId,
        completed: false,
        mode: current.mode,
      });
      setPendingSavePrompt(null);
    },
    [persistSession],
  );

  const dismissSavePrompt = useCallback(() => {
    setPendingSavePrompt(null);
  }, []);

  const reset = useCallback(() => {
    stopTicking();
    setElapsed(0);
    pausedElapsedRef.current = 0;
    setTimerState("idle");
    setCurrentCycle(1);
    setIsBreak(false);
    setActiveSession(null);
  }, [stopTicking, setActiveSession]);

  const skipBreak = useCallback(() => {
    if (!isBreakRef.current) return;
    stopTicking();
    setIsBreak(false);
    setElapsed(0);
    pausedElapsedRef.current = 0;
    setTimerState("idle");
    setActiveSession(null);
  }, [stopTicking, setActiveSession]);

  const resumeRecoveredSession = useCallback(() => {
    if (!activeSession) return;
    setShowRecovery(false);

    const totalElapsed = activeSession.pausedByClose
      ? activeSession.pausedElapsed
      : activeSession.pausedElapsed +
        (Date.now() - new Date(activeSession.startedAt).getTime());

    pausedElapsedRef.current = totalElapsed;
    setElapsed(totalElapsed);
    setTimerState("running");

    if (activeSession.pomodoroState) {
      setCurrentCycle(activeSession.pomodoroState.currentCycle);
      setIsBreak(activeSession.pomodoroState.isBreak);
    }

    startTicking();
  }, [activeSession, startTicking]);

  const saveRecoveredSession = useCallback(() => {
    if (!activeSession) return;
    setShowRecovery(false);

    const sessionStart = new Date(activeSession.startedAt).getTime();
    const totalElapsed =
      activeSession.pausedElapsed + (Date.now() - sessionStart);

    const session: CompletedSession = {
      startedAt: activeSession.startedAt,
      endedAt: new Date().toISOString(),
      duration: totalElapsed,
      mode: activeSession.mode,
      completed: false,
    };

    onSessionCompleteRef.current?.(session);
    setActiveSession(null);
    setTimerState("idle");
  }, [activeSession, setActiveSession]);

  const dismissRecovery = useCallback(() => {
    setShowRecovery(false);
    setActiveSession(null);
  }, [setActiveSession]);

  useEffect(() => {
    if (!activeSession) return;

    if (
      activeSession.timerState === "running" ||
      (activeSession.timerState === "paused" && activeSession.pausedByClose)
    ) {
      setShowRecovery(true);
    } else if (activeSession.timerState === "paused") {
      pausedElapsedRef.current = activeSession.pausedElapsed;
      setElapsed(activeSession.pausedElapsed);
      setTimerState("paused");

      if (activeSession.pomodoroState) {
        setCurrentCycle(activeSession.pomodoroState.currentCycle);
        setIsBreak(activeSession.pomodoroState.isBreak);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function freezeOnClose() {
      const state = timerStateRef.current;
      if (state !== "running" && state !== "break") return;
      const elapsedNow =
        pausedElapsedRef.current +
        (startTimeRef.current ? Date.now() - startTimeRef.current : 0);
      try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        if (!raw) return;
        const sess = JSON.parse(raw) as TimerSession;
        window.localStorage.setItem(
          STORAGE_KEYS.ACTIVE_SESSION,
          JSON.stringify({
            ...sess,
            timerState: "paused",
            pausedElapsed: elapsedNow,
            pausedByClose: true,
          }),
        );
      } catch {
      }
    }
    window.addEventListener("pagehide", freezeOnClose);
    window.addEventListener("beforeunload", freezeOnClose);
    return () => {
      window.removeEventListener("pagehide", freezeOnClose);
      window.removeEventListener("beforeunload", freezeOnClose);
    };
  }, []);

  return {
    timerState,
    elapsed,
    remaining,
    currentCycle,
    isBreak,
    targetDuration,
    showRecovery,
    pendingSavePrompt,

    start,
    pause,
    stop,
    reset,
    skipBreak,

    resumeRecoveredSession,
    saveRecoveredSession,
    dismissRecovery,

    confirmSaveSession,
    dismissSavePrompt,
  };
}
