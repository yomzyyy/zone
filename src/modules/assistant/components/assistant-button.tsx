"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { AssistantPanel } from "./assistant-panel";

export function AssistantButton() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
        aria-label="Open Zone Assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      <AssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
