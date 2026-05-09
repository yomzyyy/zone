"use client";

import { useCallback, useState } from "react";
import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import {
  ASSISTANT_DAILY_LIMIT,
  ASSISTANT_STORAGE_KEYS,
} from "../constants";
import type {
  AssistantContext,
  AssistantMessage,
  SendMessageResponse,
} from "../types";
import { generateMessageId, todayKey } from "../utils";

interface UsageState {
  date: string;
  count: number;
}

export function useAssistant(getContext: () => AssistantContext) {
  const [history, setHistory] = useLocalStorage<AssistantMessage[]>(
    ASSISTANT_STORAGE_KEYS.HISTORY,
    [],
  );
  const [usage, setUsage] = useLocalStorage<UsageState>(
    ASSISTANT_STORAGE_KEYS.USAGE,
    { date: todayKey(), count: 0 },
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayKey();
  const todayCount = usage.date === today ? usage.count : 0;
  const remaining = Math.max(0, ASSISTANT_DAILY_LIMIT - todayCount);

  const incrementUsage = useCallback(() => {
    setUsage((prev) => {
      if (prev.date !== today) {
        return { date: today, count: 1 };
      }
      return { date: today, count: prev.count + 1 };
    });
  }, [setUsage, today]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (remaining <= 0) {
        setError(
          `You've used your ${ASSISTANT_DAILY_LIMIT} messages today. Come back tomorrow.`,
        );
        return;
      }

      setError(null);

      const userMessage: AssistantMessage = {
        id: generateMessageId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => [...prev, userMessage]);
      setIsPending(true);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history,
            context: getContext(),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Request failed");
        }

        const reply: AssistantMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: (data as SendMessageResponse).reply,
          createdAt: new Date().toISOString(),
        };

        setHistory((prev) => [...prev, reply]);
        incrementUsage();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reach assistant";
        setError(message);
      } finally {
        setIsPending(false);
      }
    },
    [getContext, history, incrementUsage, remaining, setHistory],
  );

  const clear = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    history,
    isPending,
    error,
    remaining,
    sendMessage,
    clear,
  };
}
