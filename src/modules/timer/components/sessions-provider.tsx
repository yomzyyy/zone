"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import {
  createClient,
  isSupabaseConfigured,
} from "@/shared/lib/supabase/client";
import {
  fetchRecentSessions,
  insertCompletedSession,
} from "@/shared/lib/supabase/queries/sessions";
import { STORAGE_KEYS } from "../constants";
import type { CompletedSession } from "../types";

interface SessionsContextValue {
  sessions: CompletedSession[];
  addSession: (session: CompletedSession) => void;
}

const SessionsContext = createContext<SessionsContextValue | undefined>(
  undefined,
);

function readLocal(): CompletedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.COMPLETED_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedSession[];
  } catch {
    return [];
  }
}

function writeLocal(sessions: CompletedSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.COMPLETED_SESSIONS,
      JSON.stringify(sessions),
    );
  } catch {
  }
}

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabaseRef = useRef(
    typeof window === "undefined" ? null : createClient(),
  );

  const hydratedFromLocalRef = useRef(false);
  useEffect(() => {
    if (hydratedFromLocalRef.current) return;
    hydratedFromLocalRef.current = true;
    setSessions(readLocal());
  }, []);

  useEffect(() => {
    if (!hydratedFromLocalRef.current) return;
    writeLocal(sessions);
  }, [sessions]);

  const sync = useMemo(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !isAuthenticated || !user || !isSupabaseConfigured()) {
      return null;
    }
    return { supabase, userId: user.id };
  }, [isAuthenticated, user]);

  const lastUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = sync?.userId ?? null;
    if (currentUserId === lastUserIdRef.current) return;
    lastUserIdRef.current = currentUserId;

    if (!sync) {
      setSessions([]);
      return;
    }

    (async () => {
      try {
        const fresh = await fetchRecentSessions(sync.supabase, 500);
        setSessions(fresh);
      } catch (err) {
        console.warn("[sessions sync] fetch failed:", err);
      }
    })();
  }, [authLoading, sync]);

  const addSession = useCallback(
    (session: CompletedSession) => {
      setSessions((prev) => [...prev, session]);
      if (sync) {
        insertCompletedSession(sync.supabase, sync.userId, session).catch(
          (err) => {
            console.warn("[sessions sync] insert failed:", err);
          },
        );
      }
    },
    [sync],
  );

  const value = useMemo<SessionsContextValue>(
    () => ({ sessions, addSession }),
    [sessions, addSession],
  );

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}

export function useSessions(): SessionsContextValue {
  const ctx = useContext(SessionsContext);
  if (ctx === undefined) {
    throw new Error("useSessions must be used within a SessionsProvider");
  }
  return ctx;
}
