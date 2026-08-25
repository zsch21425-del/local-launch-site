"use client";

import { useState } from "react";
import { Search, FileText, PenLine, Send, Loader2 } from "lucide-react";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface DispatchAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: (name: string) => string;
}

const ACTIONS: DispatchAction[] = [
  {
    id: "audit",
    label: "Run SEO audit",
    icon: <Search className="size-3.5" />,
    prompt: (n) => `Run a fresh SEO/GEO audit for client "${n}". Report gaps, keyword opportunities, and the top 3 fixes.`,
  },
  {
    id: "reviews",
    label: "Check reviews",
    icon: <FileText className="size-3.5" />,
    prompt: (n) => `Check the latest Google reviews for "${n}". Summarize recent reviews, flag any unanswered or critical ones.`,
  },
  {
    id: "pitch",
    label: "Draft pitch",
    icon: <PenLine className="size-3.5" />,
    prompt: (n) => `Draft a pitch email for client "${n}" following the Local Launch pitch playbook. DO NOT SEND — draft for approval.`,
  },
  {
    id: "status",
    label: "Ask agent",
    icon: <Send className="size-3.5" />,
    prompt: (n) => `Give me a status update on client "${n}": where they are in the pipeline, what's done, what's next.`,
  },
];

/** One-click action bar that dispatches work to the Supervisor agent for this client. */
export function QuickDispatch({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: DispatchAction) => {
    setBusy(action.id);
    setReply(null);
    setError(null);
    try {
      const r = await fetch("/api/fleet/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "local-launch-supervisor",
          message: `${action.prompt(companyName)}\n\n(Client ID: ${companyId})`,
        }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Dispatch failed");
      setReply(d.reply);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn(glass, "rounded-xl p-5")}>
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Quick Actions</h2>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a)}
            disabled={busy !== null}
            className="flex items-center gap-1.5 rounded-lg border border-[#2AA8A8]/30 bg-[#2AA8A8]/10 px-3 py-1.5 text-xs font-medium text-[#2AA8A8] hover:bg-[#2AA8A8]/20 disabled:opacity-50 transition-colors"
          >
            {busy === a.id ? <Loader2 className="size-3.5 animate-spin" /> : a.icon}
            {a.label}
          </button>
        ))}
      </div>
      {busy && <p className="mt-3 text-xs text-slate-400">Dispatching to Supervisor…</p>}
      {reply && (
        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs whitespace-pre-wrap max-h-48 overflow-auto text-slate-700">
          {reply}
        </div>
      )}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}
