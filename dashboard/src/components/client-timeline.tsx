"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  ts: string | null;      // ISO date or null
  type: string;           // stage|playbook|pitch|audit|contact|vault|sync
  detail: string;
  actor?: string;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  stage: { icon: "🚦", color: "text-amber-500" },
  playbook: { icon: "✅", color: "text-emerald-500" },
  pitch: { icon: "📨", color: "text-sky-500" },
  audit: { icon: "🔍", color: "text-violet-500" },
  contact: { icon: "📞", color: "text-slate-400" },
  vault: { icon: "📄", color: "text-teal-500" },
  sync: { icon: "🔄", color: "text-blue-400" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

/** Client activity timeline — derived from pipeline state + Obsidian vault. */
export function ClientTimeline({ companyId }: { companyId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/client/activity?companyId=${encodeURIComponent(companyId)}`);
      const d = await r.json();
      if (r.status === 503 || d.error === "local-only") {
        setError("local-only");
        setEvents([]);
        return;
      }
      if (!r.ok) throw new Error(d.error || "Failed to load activity");
      setEvents(d.events ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={cn(glass, "rounded-xl p-5")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Activity className="size-4 text-[#2AA8A8]" /> Activity Timeline
        </h2>
        <button onClick={load} className="text-xs text-slate-400 hover:text-slate-600" aria-label="Refresh activity">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {error === "local-only" ? (
        <p className="text-sm text-slate-400 py-2">Activity from the vault is available on the local dashboard only.</p>
      ) : error ? (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      ) : null}
      {loading && events.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">Loading activity…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">No recorded activity yet for this client.</p>
      ) : (
        <ol className="relative flex flex-col gap-3 before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-px before:bg-slate-200">
          {events.map((e, i) => {
            const meta = TYPE_META[e.type] ?? TYPE_META.contact;
            return (
              <li key={i} className="relative pl-6">
                <span className="absolute left-0 top-0.5 grid size-[11px] place-items-center rounded-full bg-white ring-1 ring-slate-200 text-[8px]">
                  <span className={cn("text-[9px] leading-none", meta.color)}>{meta.icon}</span>
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-medium text-slate-500">{fmtDate(e.ts)}</span>
                  {e.actor && <span className="text-[11px] text-slate-400">{e.actor}</span>}
                </div>
                <p className="text-sm text-slate-600 leading-snug">{e.detail}</p>
              </li>
            );
          })}
        </ol>
      )}

      {/* (Asset gallery moved to dedicated ClientAssets component — Assets tab) */}
    </div>
  );
}
