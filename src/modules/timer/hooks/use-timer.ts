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

// Play a short beep sound using the Web Audio API.
// Creates a temporary AudioContext, plays a tone, then closes it to avoid memory leaks.
function playNotificationSound() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    oscillator.stop(audioContext.currentTime + 0.2);

    // Close the AudioContext after the sound finishes to prevent memory leaks
    oscillator.addEventListener("ended", () => {
      audioContext.close();
    });
  } catch {
    // Audio may not be available — that's fine, just skip
  }
}

export function useTimer(settings: TimerSettings) {
  // --- State ---
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  // --- Refs ---
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);

  // Refs that mirror state — so callbacks always read the latest value
  const timerStateRef = useRef<TimerState>("idle");
  const isBreakRef = useRef(false);
  const currentCycleRef = useRef(1);
  const elapsedRef = useRef(0);
  const settingsRef = useRef(settings);

  // Keep refs in sync with state
  useEffect(() => { timerStateRef.current = timerState; }, [timerState]);
  useEffect(() => { isBreakRef.current = isBreak; }, [isBreak]);
  useEffect(() => { currentCycleRef.current = currentCycle; }, [currentCycle]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // --- localStorage persistence ---
  const [activeSession, setActiveSession] =
    useLocalStorage<TimerSession | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
  const [completedSessions, setCompletedSessions] = useLocalStorage<
    CompletedSession[]
  >(STORAGE_KEYS.COMPLETED_SESSIONS, []);

  // --- Computed values ---
  const getTargetDuration = useCallback(() => {
    const s = settingsRef.current;
    if (isBreakRef.current) {
      const isLongBreak = currentCycleRef.current > s.sessionsUntilLongBreak;
      return minutesToMs(isLongBreak ? s.longBreakDuration : s.breakDuration);
    }
    return minutesToMs(s.focusDuration);
  }, []);

  const targetDuration = isBreak
    ? minutesToMs(
        currentCycle > settings.sessionsUntilLongBreak
          ? settings.longBreakDuration
          : settings.breakDuration
      )
    : minutesToMs(settings.focusDuration);

  const remaining =
    settings.mode === "pomodoro" ? Math.max(0, targetDuration - elapsed) : 0;

  // --- Stop the animation loop ---
  const stopTicking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // --- Save a completed session ---
  const saveCompletedSession = useCallback(
    (completed: boolean) => {
      const currentElapsed = elapsedRef.current;
      if (currentElapsed < 1000) return;

      const session: CompletedSession = {
        startedAt: new Date(Date.now() - currentElapsed).toISOString(),
        endedAt: new Date().toISOString(),
        duration: currentElapsed,
        mode: settingsRef.current.mode,
        completed,
      };

      setCompletedSessions((prev) => [...prev, session]);
    },
    [setCompletedSessions]
  );

  // --- Pomodoro phase completion ---
  const handlePhaseComplete = useCallback(() => {
    stopTicking();

    if (settingsRef.current.soundEnabled) {
      playNotificationSound();
    }

    if (isBreakRef.current) {
      const wasLongBreak =
        currentCycleRef.current > settingsRef.current.sessionsUntilLongBreak;
      if (wasLongBreak) {
        setCurrentCycle(1);
      }
      setIsBreak(false);
      setElapsed(0);
      pausedElapsedRef.current = 0;
      setTimerState("idle");
      setActiveSession(null);
    } else {
      const nextCycle = currentCycleRef.current + 1;
      setCurrentCycle(nextCycle);
      setIsBreak(true);
      setElapsed(0);
      pausedElapsedRef.current = 0;
      setTimerState("break");

      saveCompletedSession(true);

      // Auto-start break timer
      startTimeRef.current = Date.now();
      const tickFn = () => {
        if (startTimeRef.current === null) return;
        const newElapsed = Date.now() - startTimeRef.current;
        setElapsed(newElapsed);

        const s = settingsRef.current;
        const isLongBreak = nextCycle > s.sessionsUntilLongBreak;
        const breakDur = minutesToMs(isLongBreak ? s.longBreakDuration : s.breakDuration);
        if (newElapsed >= breakDur) {
          cancelAnimationFrame(animationFrameRef.current!);
          animationFrameRef.current = null;
          startTimeRef.current = null;
          if (s.soundEnabled) playNotificationSound();
          if (isLongBreak) setCurrentCycle(1);
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

  // --- The tick function ---
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

  // --- Start the animation loop ---
  const startTicking = useCallback(() => {
    startTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // --- Public controls ---

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
      prev ? { ...prev, timerState: "paused", pausedElapsed: currentElapsed } : null
    );
  }, [stopTicking, setActiveSession]);

  const stop = useCallback(() => {
    stopTicking();
    saveCompletedSession(false);
    setTimerState("completed");
    setActiveSession(null);
  }, [stopTicking, saveCompletedSession]);

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

  // --- Recovery ---
  const resumeRecoveredSession = useCallback(() => {
    if (!activeSession) return;
    setShowRecovery(false);

    const sessionStart = new Date(activeSession.startedAt).getTime();
    const totalElapsed =
      activeSession.pausedElapsed + (Date.now() - sessionStart);

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

    setCompletedSessions((prev) => [...prev, session]);
    setActiveSession(null);
    setTimerState("idle");
  }, [activeSession, setCompletedSessions]);

  const dismissRecovery = useCallback(() => {
    setShowRecovery(false);
    setActiveSession(null);
  }, [setActiveSession]);

  // --- Detect active session on page load ---
  useEffect(() => {
    if (!activeSession) return;

    if (activeSession.timerState === "running") {
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

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    timerState,
    elapsed,
    remaining,
    currentCycle,
    isBreak,
    targetDuration,
    completedSessions,
    showRecovery,

    start,
    pause,
    stop,
    reset,
    skipBreak,

    resumeRecoveredSession,
    saveRecoveredSession,
    dismissRecovery,
  };
}
