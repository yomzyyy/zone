"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/shared/lib/supabase/client";
import type { AuthContextType } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Wipe per-user local state so the next person at this browser doesn't
    // inherit board, sessions, or active timer from the previous account.
    // The migration flag is also cleared so a future guest -> signin flow
    // can re-migrate from a fresh slate.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("zone-board-state");
        window.localStorage.removeItem("zone-completed-sessions");
        window.localStorage.removeItem("zone-active-session");
        window.localStorage.removeItem("zone-active-task-id");
        window.localStorage.removeItem("zone-guest-migrated");
      } catch {
        /* swallow */
      }
    }
    setUser(null);
  }, [supabase]);

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
