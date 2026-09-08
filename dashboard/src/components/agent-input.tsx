"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";

const FIELD =
  "flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-ring/20 focus:outline-none disabled:opacity-60";

export function AgentInput({
  onSend,
  disabled = false,
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-border p-3"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Message the agent…"
        disabled={disabled}
        aria-label="Message the agent"
        className={FIELD}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
      >
        <SendHorizontal className="size-4" aria-hidden />
      </button>
    </form>
  );
}
