"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Trash2, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useSessions } from "@/modules/timer/components/sessions-provider";
import { useBoard } from "@/modules/tasks/hooks/use-board";
import {
  computeStreak,
  computeTotals,
} from "@/modules/analytics/utils";
import { useAssistant } from "../hooks/use-assistant";
import type { AssistantContext } from "../types";
import { MessageBubble } from "./message-bubble";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const { sessions } = useSessions();
  const board = useBoard();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const getContext = useMemo(
    () => (): AssistantContext => {
      const totals = computeTotals(sessions);
      return {
        tasks: board.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
        todayMinutes: Math.round(totals.todayMs / 60_000),
        todaySessions: totals.todaySessions,
        streakDays: computeStreak(sessions),
      };
    },
    [board.tasks, sessions],
  );

  const assistant = useAssistant(getContext);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, assistant.history.length]);

  if (!open) return null;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    assistant.sendMessage(text);
  }

  return (
    <div className="fixed inset-0 z-50 flex sm:inset-auto sm:bottom-20 sm:right-6 sm:h-[600px] sm:max-h-[80vh] sm:w-[400px]">
      <div
        className="flex h-full w-full flex-col rounded-none border bg-background shadow-2xl sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Zone Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {assistant.remaining} message{assistant.remaining === 1 ? "" : "s"}{" "}
              left today
            </p>
          </div>
          <div className="flex items-center gap-1">
            {assistant.history.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={assistant.clear}
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto p-4"
        >
          {assistant.history.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2">
              <p>Hey! What are we working on today?</p>
              <p className="text-xs">
                Try: &quot;What should I focus on?&quot; or &quot;How
                productive was I this week?&quot;
              </p>
            </div>
          )}
          {assistant.history.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {assistant.isPending && (
            <div className="text-xs text-muted-foreground italic">
              Thinking...
            </div>
          )}
          {assistant.error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {assistant.error}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t p-3"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              assistant.remaining > 0
                ? "Ask the assistant..."
                : "Daily limit reached"
            }
            disabled={assistant.isPending || assistant.remaining <= 0}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              assistant.isPending ||
              !draft.trim() ||
              assistant.remaining <= 0
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
