"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, MonitorPlay, Search } from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { glassCard } from "@/lib/ui";

interface DemoEntry {
  companyId: string;
  name: string;
  category?: string;
  location?: string;
  url: string;
  status: "pending" | "rejected" | "rework" | "none" | string;
}

/** Deterministic gradient for the thumbnail tile (no external screenshot needed). */
function thumbGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 55% 45%), hsl(${(h + 40) % 360} 60% 35%))`;
}

function initials(name: string): string {
  return name
    .replace(/[^A-Za-z0-9 &]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w !== "&")
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default function DemosPage() {
  const [demos, setDemos] = useState<DemoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "rejected" | "rework">("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/demos");
      const data = await res.json();
      setDemos(data.demos ?? []);
    } catch {
      // keep last known
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    return demos
      .filter((d) => !removedIds.has(d.companyId))
      .filter((d) => (filter === "all" ? true : d.status === filter))
      .filter((d) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          (d.category ?? "").toLowerCase().includes(q) ||
          (d.location ?? "").toLowerCase().includes(q)
        );
      });
  }, [demos, removedIds, filter, query]);

  const pendingCount = demos.filter((d) => !removedIds.has(d.companyId) && d.status === "pending").length;

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="group -ml-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to pipeline
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Demo Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {pendingCount} demo{pendingCount !== 1 ? "s" : ""} waiting for your review
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, category, or location…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-300 bg-white p-1">
            {(["all", "pending", "rejected", "rework"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors " +
                  (filter === f
                    ? "bg-emerald-500 text-white"
                    : "text-slate-500 hover:bg-slate-100")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-sm text-slate-400">Loading demos…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-lg font-medium text-slate-600">
              {demos.length === 0
                ? "All caught up! No demos waiting for approval."
                : "No demos match your filter."}
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
            >
              Back to pipeline →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {visible.map((demo) => (
              <DemoCard
                key={demo.companyId}
                demo={demo}
                onDone={(id) => setRemovedIds((prev) => new Set(prev).add(id))}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DemoCard({
  demo,
  onDone,
}: {
  demo: DemoEntry;
  onDone: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRejected = demo.status === "rejected";
  const isRework = demo.status === "rework";
  const pending = demo.status === "pending";

  async function act(action: "approve" | "reject" | "rework") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: demo.companyId, action }),
      });
      const json = await res.json();
      if (json.ok) onDone(demo.companyId);
      else setError(json.error || "Action failed");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const badge = isRejected
    ? { label: "Rejected", cls: "bg-amber-100 text-amber-700" }
    : isRework
      ? { label: "Rework", cls: "bg-violet-100 text-violet-700" }
      : { label: "Pending", cls: "bg-sky-100 text-sky-700" };

  return (
    <div className={`${glassCard} overflow-hidden ${pending ? "ring-1 ring-sky-200" : ""}`}>
      {/* Thumbnail */}
      <Link
        href={demo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block h-32 w-full"
        style={{ background: thumbGradient(demo.companyId) }}
      >
        <span className="absolute left-3 top-3 grid size-10 place-items-center rounded-lg bg-white/90 text-sm font-bold text-slate-800">
          {initials(demo.name)}
        </span>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <MonitorPlay className="size-3" /> Live demo
        </span>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <Link
            href={`/company/${demo.companyId}`}
            className="text-base font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
          >
            {demo.name}
          </Link>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {demo.category ? <span>{demo.category}</span> : null}
          {demo.location ? <span>{demo.location}</span> : null}
        </div>

        <a
          href={demo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:underline"
        >
          Open demo <ExternalLink className="size-3.5" />
        </a>

        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => act("approve")}
            className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? "…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => act("reject")}
            className="flex-1 rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
