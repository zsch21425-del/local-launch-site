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

import { PageHero } from "@/components/page-hero";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  regionOfLocation,
  type RegionId,
} from "@/lib/data";
import { priorityWeight } from "@/lib/stages";

type RegionFilter = "sc" | "upstate" | "all" | "out-of-state";

const REGION_LABEL: Record<RegionFilter, string> = {
  sc: "SC focus",
  upstate: "Upstate",
  all: "Everywhere",
  "out-of-state": "Expansion",
};

function matchesDemoRegion(demo: DemoEntry, region: RegionFilter): boolean {
  if (region === "all") return true;
  const r: RegionId = regionOfLocation(demo.location);
  if (region === "upstate") return r === "upstate";
  if (region === "sc") return r === "upstate" || r === "sc";
  return r === "out-of-state" || r === "unknown";
}

/**
 * Demos triage: pending + rework first (rejected/dead-letter sink),
 * then company priority, then oldest review feedback (stale fixes first).
 * Priority/age ride on fields enriched onto each entry in state (M17) — so a
 * late enrichment fetch actually re-sorts the list instead of silently not.
 */
function demoRank(d: DemoEntry): [number, number, string] {
  const statusRank =
    d.status === "pending"
      ? 0
      : d.status === "rework"
        ? 1
        : d.status === "rejected"
          ? 2
          : 3;
  const w = -priorityWeight(d.triagePriority ?? "");
  const age = d.triageReviewedAt ?? d.reviewedAt ?? "9999";
  return [statusRank, w, age];
}

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
  /** Rebuild-job state, reported separately from the canonical demo status (M13). */
  jobStatus?: "running" | "verifying" | "failed" | "dead-letter" | null;
  notes?: string | null;
  reviewFeedback?: ReviewFeedback | null;
  reviewedAt?: string | null;
  rebuildAttempts?: number;
  lastError?: string | null;
  /** Enriched from the company record at load time (M17) — used for sort only. */
  triagePriority?: string | null;
  triageReviewedAt?: string | null;
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
          box: "border-destructive bg-destructive/10",
          title: "text-destructive",
          btn: "bg-destructive hover:bg-destructive/90",
          ring: "focus:ring-destructive",
          label: "Reject",
        }
      : {
          box: "border-violet-200 bg-violet-50/60",
          title: "text-violet-200",
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
      <p className="mb-2 text-[11px] text-muted-foreground">
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
          "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
          tone.ring,
        )}
      />
      <textarea
        value={suggestedFix}
        onChange={(e) => setSuggestedFix(e.target.value)}
        placeholder="What should change? (optional — e.g. 'swap hero to real pour video, fix mobile CTA clip, use Fountain Inn not Greenville')"
        rows={2}
        className={cn(
          "mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
          tone.ring,
        )}
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
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
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

type Notice = { id: string; name: string; message: string };

export default function DemosPage() {
  const [demos, setDemos] = useState<DemoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("sc");
  const [filter, setFilter] = useState<
    "all" | "pending" | "rejected" | "rework"
  >("all");

  const pushNotice = useCallback((n: Notice) => {
    setNotices((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 8));
  }, []);
  const dismissNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/demos");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      if (data?.error) throw new Error(String(data.error));
      let list: DemoEntry[] = data.demos ?? [];
      // Enrich triage (priority + age) from company records — merged into the
      // SAME array we render + sort, so a late enrichment re-sorts (M17).
      try {
        const pr = await fetch("/api/pipeline/data");
        if (pr.ok) {
          const pd = await pr.json();
          const byId = new Map(
            ((pd.companies ?? []) as {
              id: string;
              priority?: string;
              demo?: { reviewedAt?: string };
              lastUpdated?: string;
            }[]).map((c) => [c.id, c]),
          );
          list = list.map((d) => {
            const c = byId.get(d.companyId);
            if (!c) return d;
            return {
              ...d,
              triagePriority: c.priority ?? null,
              triageReviewedAt:
                c.demo?.reviewedAt ?? c.lastUpdated ?? d.reviewedAt ?? null,
            };
          });
        }
      } catch {
        /* triage still works on status alone */
      }
      setDemos(list);
      setError(null);
    } catch (e) {
      // RETAIN the last good list; never collapse to "All caught up" on an error.
      setError(
        `Couldn't refresh the demo queue${
          e instanceof Error && e.message ? ` (${e.message})` : ""
        }. Showing the last loaded list.`,
      );
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
      .filter((d) => matchesDemoRegion(d, region))
      .filter((d) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          (d.category ?? "").toLowerCase().includes(q) ||
          (d.location ?? "").toLowerCase().includes(q) ||
          (d.reviewFeedback?.reason ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const [a0, a1, a2] = demoRank(a);
        const [b0, b1, b2] = demoRank(b);
        return a0 - b0 || a1 - b1 || a2.localeCompare(b2);
      });
  }, [demos, filter, region, query]);

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
      <PageHero
        image="/art/demos.png"
        eyebrow="the exhibition"
        title="Demos"
        subtitle={`${pendingCount} waiting · ${reworkCount} need fixes.`}
        backHref="/"
        backLabel="Back to Ops"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, category, or rejection notes…"
              className="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none"
            />
          </div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionFilter)}
            className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground focus:outline-none"
            aria-label="Filter by territory"
            title="SC focus = Upstate + rest of SC. Expansion = out-of-state + unknown."
          >
            {(Object.keys(REGION_LABEL) as RegionFilter[]).map((r) => (
              <option key={r} value={r}>
                {REGION_LABEL[r]}
              </option>
            ))}
          </select>
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {(["all", "pending", "rejected", "rework"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors " +
                  (filter === f
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery / relay warnings — persist here (parent) so they survive a
            card being removed after approval (M17). */}
        {notices.length > 0 ? (
          <div className="flex flex-col gap-2">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`${glassCard} flex items-start justify-between gap-3 border-amber-200 bg-amber-50/70 px-4 py-3`}
              >
                <p className="text-sm text-amber-200">
                  <span className="font-semibold">{n.name}:</span> {n.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismissNotice(n.id)}
                  className="shrink-0 text-xs font-medium text-amber-300 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* HTTP / network error — shown even when a stale list is still on screen. */}
        {error ? (
          <div
            className={`${glassCard} flex flex-wrap items-center justify-between gap-3 border-destructive bg-destructive/10 px-4 py-3`}
          >
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-sm text-muted-foreground">Loading demos…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-lg font-medium text-muted-foreground">
              {error
                ? "Demo queue unavailable — retry above."
                : demos.length === 0
                  ? "All caught up — no demos waiting."
                  : "No demos match your filter."}
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-primary hover:underline"
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
                onNotice={pushNotice}
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
  onNotice,
}: {
  demo: DemoEntry;
  onChange: (patch: Partial<DemoEntry> | "remove-approved") => void;
  onReload: () => void;
  onNotice: (n: Notice) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<null | "reject" | "rework">(null);
  const [relayNote, setRelayNote] = useState<string | null>(null);

  const isDeadLetter =
    demo.jobStatus === "dead-letter" || demo.status === "dead-letter";
  const isVerifying = demo.jobStatus === "verifying";
  const isRejected = demo.status === "rejected" && !isDeadLetter;
  const isRework = demo.status === "rework" && !isDeadLetter && !isVerifying;
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || `Approve failed (HTTP ${res.status})`);
        return;
      }
      // Surface a delivery warning in the PERSISTENT parent panel BEFORE the
      // card is removed (M17) — a note set on the card here would vanish.
      if (!json.relayed) {
        onNotice({
          id: demo.companyId,
          name: demo.name,
          message: `Demo approved and saved, but the agent relay did not confirm${
            json.relayError ? ` (${json.relayError})` : ""
          }. The status is on the record — follow up if the agent doesn't pick it up.`,
        });
      }
      onChange("remove-approved");
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
      if (!json.relayed) {
        onNotice({
          id: demo.companyId,
          name: demo.name,
          message: `${
            mode === "reject" ? "Rejection" : "Rework"
          } notes saved, but the agent relay did not confirm${
            json.relayError ? ` (${json.relayError})` : ""
          }. Notes are on the company record.`,
        });
      }
      // soft refresh so list stays consistent
      setTimeout(onReload, 800);
    } finally {
      setLoading(false);
    }
  }

  const badge = isDeadLetter
    ? { label: "Dead-letter", cls: "bg-red-100 text-red-300" }
    : isVerifying
      ? { label: "Verifying · QA", cls: "bg-amber-100 text-amber-300" }
      : isRejected
        ? { label: "Rejected", cls: "bg-destructive/10 text-destructive" }
        : isRework
          ? { label: "Rework", cls: "bg-violet-100 text-violet-300" }
          : { label: "Pending", cls: "bg-sky-100 text-sky-300" };

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
        <span className="absolute top-3 left-3 grid size-10 place-items-center rounded-lg bg-card/90 text-sm font-bold text-foreground">
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
            className="text-base font-semibold text-foreground transition-colors hover:text-primary"
          >
            {demo.name}
          </Link>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {demo.category ? <span>{demo.category}</span> : null}
          {demo.location ? <span>{demo.location}</span> : null}
        </div>

        <a
          href={demo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Open demo <ExternalLink className="size-3.5" />
        </a>

        {/* Prior feedback — always visible when present */}
        {fb?.reason ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-xs font-semibold text-amber-100">
              Your notes to the agent
            </p>
            <p className="mt-1 text-sm text-foreground">
              <span className="font-medium text-muted-foreground">Reason:</span>{" "}
              {fb.reason}
            </p>
            {fb.suggestedFix ? (
              <p className="mt-1 text-sm text-foreground">
                <span className="font-medium text-muted-foreground">Fix:</span>{" "}
                {fb.suggestedFix}
              </p>
            ) : null}
            {fb.reviewedAt ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(fb.reviewedAt).toLocaleString()}
              </p>
            ) : null}
            <Link
              href={`/client/${demo.companyId}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Open client → chat agent about this fix
            </Link>
          </div>
        ) : null}

        {isVerifying ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-xs font-semibold text-amber-100">
              Rebuilt — awaiting vision QA. Can&apos;t be approved until the
              verification pass clears it.
            </p>
          </div>
        ) : null}

        {isDeadLetter ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50/80 p-3">
            <p className="text-xs font-semibold text-red-200">
              ☠ Failed {demo.rebuildAttempts ?? 3} rebuild attempts — needs manual re-queue
            </p>
            {demo.lastError ? (
              <p className="mt-1 text-sm text-foreground">
                <span className="font-medium text-muted-foreground">Last error:</span>{" "}
                {demo.lastError}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        {relayNote ? (
          <p className="mt-2 text-xs text-primary">{relayNote}</p>
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
              disabled={loading || isVerifying}
              title={isVerifying ? "Awaiting vision QA — cannot approve yet" : undefined}
              onClick={() => void approve()}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
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
              className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
