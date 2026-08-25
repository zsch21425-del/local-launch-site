"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { usePipeline } from "@/hooks/use-pipeline";
import { cn } from "@/lib/utils";

/** Type-ahead company lookup against the live pipeline. Empty = not in the dashboard. */
export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { companies } = usePipeline();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = q.trim()
    ? companies
        .filter((c) => {
          const t = q.toLowerCase();
          return (
            c.name.toLowerCase().includes(t) ||
            (c.category ?? "").toLowerCase().includes(t) ||
            (c.location ?? "").toLowerCase().includes(t)
          );
        })
        .slice(0, 8)
    : [];

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Find a company…"
          aria-label="Find a company already in the dashboard"
          className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      {open && q.trim() ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">Not in the dashboard yet.</p>
          ) : (
            matches.map((c) => (
              <button
                key={c.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  router.push(`/client/${c.id}`);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="truncate font-medium text-slate-700">{c.name}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-slate-400">
                  {c.stage}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
