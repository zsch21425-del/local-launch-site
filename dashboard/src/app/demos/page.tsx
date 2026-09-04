"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  MessageSquareWarning,
  MonitorPlay,
  Search,
} from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface ReviewFeedback {
  reason: string;
  suggestedFix?: string;
  reviewedAt: string;
}

interface DemoEntry {
  companyId: string;
  name: string;
  category?: string;
  location?: string;
  url: string;
  status: "pending" | "rejected" | "rework" | "dead-letter" | "none" | string;
  notes?: string | null;
  reviewFeedback?: ReviewFeedback | null;
  reviewedAt?: string | null;
  rebuildAttempts?: number;
  lastError?: string | null;
}

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

/** Reject / rework form — reason required, fix notes optional. Mirrors pitch approvals. */
function DemoFeedbackForm({
  name,
  mode,
  onCancel,
  onSubmit,
}: {
  name: string;
  mode: "reject" | "rework";
  onCancel: () => void;
  onSubmit: (reason: string, suggestedFix: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [suggestedFix, setSuggestedFix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    if (!reason.trim()) {
      setError("A reason is required so the agent knows what to fix.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(reason.trim(), suggestedFix.trim());
    } catch (e: any) {
      setError(e?.message || "Something went wrong — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const tone =
    mode === "reject"
      ? {
          box: "border-rose-200 bg-rose-50/60",
          title: "text-rose-700",
          btn: "bg-rose-600 hover:bg-rose-700",
          ring: "focus:ring-rose-400",
          label: "Reject",
        }
      : {
          box: "border-violet-200 bg-violet-50/60",
          title: "text-violet-800",
          btn: "bg-violet-600 hover:bg-violet-700",
          ring: "focus:ring-violet-400",
          label: "Request rework",
        };

  return (
    <div className={cn("mt-4 rounded-lg border p-4", tone.box)}>
      <p className={cn("mb-1 flex items-center gap-1.5 text-sm font-medium", tone.title)}>
        <MessageSquareWarning className="size-4" />
        {tone.label} &quot;{name}&quot; — tell the agent what to fix
      </p>
      <p className="mb-2 text-[11px] text-slate-500">
        This is saved on the company record and sent to the Local Launch agent.
        You should not need Telegram for the same note.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong? Be specific (hero too dark, wrong trade photos, phone missing, AI slop copy…)"
        rows={3}
        autoFocus
        className={cn(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2",
          tone.ring,
        )}
      />
      <textarea
        value={suggestedFix}
        onChange={(e) => setSuggestedFix(e.target.value)}
        placeholder="What should change? (optional — e.g. 'swap hero to real pour video, fix mobile CTA clip, use Fountain Inn not Greenville')"
        rows={2}
        className={cn(
          "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2",
          tone.ring,
        )}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handle()}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50",
            tone.btn,
          )}
        >
          {saving ? "Sending to agent…" : `Submit ${tone.label.toLowerCase()}`}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DemosPage() {
  const [demos, setDemos] = useState<DemoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "rejected" | "rework"
  >("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/demos");
      const data = await res.json();
      setDemos(data.demos ?? []);
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    return demos
      .filter((d) => (filter === "all" ? true : d.status === filter))
      .filter((d) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          (d.category ?? "").toLowerCase().includes(q) ||
          (d.location ?? "").toLowerCase().includes(q) ||
          (d.reviewFeedback?.reason ?? "").toLowerCase().includes(q)
        );
      });
  }, [demos, filter, query]);

  const pendingCount = demos.filter((d) => d.status === "pending").length;
  const reworkCount = demos.filter(
    (d) => d.status === "rework" || d.status === "rejected",
  ).length;

  function patchLocal(
    id: string,
    patch: Partial<DemoEntry> | "remove-approved",
  ) {
    setDemos((prev) => {
      if (patch === "remove-approved") {
        return prev.filter((d) => d.companyId !== id);
      }
      return prev.map((d) =>
        d.companyId === id ? { ...d, ...patch } : d,
      );
    });
  }

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="group -ml-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Ops
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Demo Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {pendingCount} waiting · {reworkCount} need fixes
            {" · "}
            Reject/rework requires notes — sent straight to the agent
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, category, or rejection notes…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-300 bg-white p-1">
            {(["all", "pending", "rejected", "rework"] as const).map((f) => (
              <button
                key={f}
                type="button"
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
                ? "All caught up — no demos waiting."
                : "No demos match your filter."}
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
            >
              Back to Ops →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {visible.map((demo) => (
              <DemoCard
                key={demo.companyId}
                demo={demo}
                onChange={(patch) => patchLocal(demo.companyId, patch)}
                onReload={() => void load()}
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
  onChange,
  onReload,
}: {
  demo: DemoEntry;
  onChange: (patch: Partial<DemoEntry> | "remove-approved") => void;
  onReload: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<null | "reject" | "rework">(null);
  const [relayNote, setRelayNote] = useState<string | null>(null);

  const isRejected = demo.status === "rejected";
  const isRework = demo.status === "rework";
  const isDeadLetter = demo.status === "dead-letter";
  const pending = demo.status === "pending";
  const fb = demo.reviewFeedback;

  async function approve() {
    setLoading(true);
    setError("");
    setRelayNote(null);
    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: demo.companyId, action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Approve failed");
        return;
      }
      onChange("remove-approved");
      if (!json.relayed) {
        setRelayNote(
          "Approved & saved. Agent relay was slow — status is still on the record.",
        );
      }
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(
    mode: "reject" | "rework",
    reason: string,
    suggestedFix: string,
  ) {
    setLoading(true);
    setError("");
    setRelayNote(null);
    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: demo.companyId,
          action: mode,
          reason,
          suggestedFix,
          notes: reason,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Request failed");
      }
      onChange({
        status: mode === "reject" ? "rejected" : "rework",
        notes: reason,
        reviewFeedback: json.reviewFeedback ?? {
          reason,
          suggestedFix: suggestedFix || undefined,
          reviewedAt: new Date().toISOString(),
        },
      });
      setForm(null);
      setRelayNote(
        json.relayed
          ? "Saved + sent to the agent. They have your notes — no need to repeat in Telegram."
          : "Saved on the record. Agent relay lagged — notes are still stored; agent will see them on the company.",
      );
      // soft refresh so list stays consistent
      setTimeout(onReload, 800);
    } finally {
      setLoading(false);
    }
  }

  const badge = isDeadLetter
    ? { label: "Dead-letter", cls: "bg-red-100 text-red-700" }
    : isRejected
      ? { label: "Rejected", cls: "bg-rose-100 text-rose-700" }
      : isRework
        ? { label: "Rework", cls: "bg-violet-100 text-violet-700" }
        : { label: "Pending", cls: "bg-sky-100 text-sky-700" };

  return (
    <div
      className={`${glassCard} overflow-hidden ${pending ? "ring-1 ring-sky-200" : ""}`}
    >
      <Link
        href={demo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block h-32 w-full"
        style={{ background: thumbGradient(demo.companyId) }}
      >
        <span className="absolute top-3 left-3 grid size-10 place-items-center rounded-lg bg-white/90 text-sm font-bold text-slate-800">
          {initials(demo.name)}
        </span>
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <MonitorPlay className="size-3" /> Live demo
        </span>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <Link
            href={`/client/${demo.companyId}`}
            className="text-base font-semibold text-slate-900 transition-colors hover:text-emerald-600"
          >
            {demo.name}
          </Link>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
          >
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

        {/* Prior feedback — always visible when present */}
        {fb?.reason ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-xs font-semibold text-amber-900">
              Your notes to the agent
            </p>
            <p className="mt-1 text-sm text-slate-800">
              <span className="font-medium text-slate-600">Reason:</span>{" "}
              {fb.reason}
            </p>
            {fb.suggestedFix ? (
              <p className="mt-1 text-sm text-slate-800">
                <span className="font-medium text-slate-600">Fix:</span>{" "}
                {fb.suggestedFix}
              </p>
            ) : null}
            {fb.reviewedAt ? (
              <p className="mt-1 text-[11px] text-slate-400">
                {new Date(fb.reviewedAt).toLocaleString()}
              </p>
            ) : null}
            <Link
              href={`/client/${demo.companyId}`}
              className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline"
            >
              Open client → chat agent about this fix
            </Link>
          </div>
        ) : null}

        {isDeadLetter ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50/80 p-3">
            <p className="text-xs font-semibold text-red-800">
              ☠ Failed {demo.rebuildAttempts ?? 3} rebuild attempts — needs manual re-queue
            </p>
            {demo.lastError ? (
              <p className="mt-1 text-sm text-slate-800">
                <span className="font-medium text-slate-600">Last error:</span>{" "}
                {demo.lastError}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        {relayNote ? (
          <p className="mt-2 text-xs text-emerald-700">{relayNote}</p>
        ) : null}

        {form ? (
          <DemoFeedbackForm
            name={demo.name}
            mode={form}
            onCancel={() => setForm(null)}
            onSubmit={(reason, suggestedFix) =>
              submitFeedback(form, reason, suggestedFix)
            }
          />
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void approve()}
              className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? "…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setForm("rework")}
              className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              Rework
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setForm("reject")}
              className="flex-1 rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
