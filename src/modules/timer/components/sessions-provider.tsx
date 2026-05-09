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
    /* swallow */
  }
}

// Holds completed sessions in one place so accounts don't leak through
// localStorage. On sign-in we replace state with the user's actual sessions
// from Supabase; on sign-out we wipe local state so the next user (or guest)
// sees a clean slate.
export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabaseRef = useRef(
    typeof window === "undefined" ? null : createClient(),
  );

  // Hydrate from localStorage once on mount (guest path).
  const hydratedFromLocalRef = useRef(false);
  useEffect(() => {
    if (hydratedFromLocalRef.current) return;
    hydratedFromLocalRef.current = true;
    setSessions(readLocal());
  }, []);

  // Mirror state to localStorage so timer hook reads (which still use
  // localStorage as the source of recovery state) and Stats reloads stay
  // consistent. Only writes after first hydration to avoid clobbering.
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

  // Replace state with the user's sessions from the DB on sign-in. On
  // sign-out (transition to no user), wipe local state so the next person
  // sitting at this browser doesn't see the prior user's stats.
  const lastUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = sync?.userId ?? null;
    if (currentUserId === lastUserIdRef.current) return;
    lastUserIdRef.current = currentUserId;

    if (!sync) {
      // Signed out (or never signed in this session). Reset to empty.
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
