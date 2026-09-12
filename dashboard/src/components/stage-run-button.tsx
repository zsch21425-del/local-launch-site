"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, CheckCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-company stage-run controls for the "approve → run → evidence → advance"
 * model. One company, one stage, two human actions:
 *   - "Run work" → POST /api/companies/[id]/stage/run (dispatches to Hermes)
 *   - "Approve & advance" → POST /api/companies/[id]/stage/advance (verify gates)
 * Hermes can only submit evidence; only Zach advances.
 */

interface RunState {
  runId: string;
  stage: string;
  status: "requested" | "completed" | "failed" | "approved";
  resultDigest?: string;
  error?: string;
}

export function StageRunButton({ companyId }: { companyId: string }) {
  const [run, setRun] = useState<RunState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/companies/${companyId}/stage/state`);
      const d = await r.json().catch(() => ({}));
      if (d.run) setRun(d.run);
      else setRun(null);
    } catch {
      /* ignore — the pipeline hook drives the parent; this is just the run badge */
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function runWork() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const r = await fetch(`/api/companies/${companyId}/stage/run`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `run HTTP ${r.status}`);
      setMessage(
        d.dispatched
          ? "Work dispatched to Hermes."
          : `Run recorded${d.relayError ? ` (relay: ${d.relayError})` : ""}.`,
      );
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    if (!run?.resultDigest) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const r = await fetch(`/api/companies/${companyId}/stage/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: run.runId, resultDigest: run.resultDigest }),
      });
      const d = await r.json();
      if (!r.ok) {
        const missing = Array.isArray(d.missing) ? d.missing.join(", ") : "";
        throw new Error(`${d.error || "advance failed"}${missing ? ` — ${missing}` : ""}`);
      }
      setMessage(`Advanced → ${d.to}.`);
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const status = run?.status;
  const completed = status === "completed";
  const failed = status === "failed";
  const requested = status === "requested";

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/40 p-2">
      {requested ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-sky-400">
          <Loader2 className="size-3.5 animate-spin" /> working…
        </span>
      ) : completed ? (
        <button
          type="button"
          onClick={() => void advance()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          <CheckCheck className="size-3.5" /> Approve & advance
        </button>
      ) : failed ? (
        <button
          type="button"
          onClick={() => void runWork()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-500 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" /> Retry
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void runWork()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          Run work
        </button>
      )}

      {failed && run?.error ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
          <AlertTriangle className="size-3" /> {run.error}
        </span>
      ) : null}
      {message ? <span className="text-[10px] text-muted-foreground">{message}</span> : null}
      {error ? <span className="text-[10px] text-destructive">{error}</span> : null}
    </div>
  );
}
