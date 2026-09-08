import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
}

/** One chat bubble — user right-aligned dark, agent left-aligned with a green accent. */
export function AgentMessage({
  message,
  pending = false,
}: {
  message: ChatMessage;
  pending?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
          isUser
            ? "bg-foreground text-white"
            : "border border-primary/20 bg-primary/[0.06] text-foreground",
        )}
      >
        {pending ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Thinking…
          </span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
