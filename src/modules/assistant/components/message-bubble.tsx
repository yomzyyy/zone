import { cn } from "@/shared/utils/utils";
import type { AssistantMessage } from "../types";

export function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
          isUser
            ? "bg-foreground text-background rounded-br-sm"
            : "bg-card border rounded-bl-sm",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
