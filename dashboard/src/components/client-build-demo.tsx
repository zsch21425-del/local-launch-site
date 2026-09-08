"use client";

import { useState } from "react";
import { Hammer, Loader2 } from "lucide-react";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface BuildDemoProps {
  companyId: string;
  companyName: string;
  demoStatus?: string;
}

/**
 * "Build demo" gate — shown when a prospect has NO demo yet but is demo-ready.
 * Greenlights the agent (Supervisor) to build the demo. Once requested, shows
 * "in progress" until a demo URL lands and the card flips into the approval
 * panel for review.
 */
export function ClientBuildDemo({ companyId, companyName, demoStatus }: BuildDemoProps) {
  const isBuilding = demoStatus === "build-requested";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(isBuilding);
  // Request landed on the record but the agent relay failed — build won't
  // start until it's retried.
  const [relayFailed, setRelayFailed] = useState(false);

  async function build() {
    setLoading(true);
    setError("");
    setRelayFailed(false);
    try {
      const res = await fetch("/api/pipeline/build-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || "Request failed");
        return;
      }
      setRequested(true);
      // alreadyExists / alreadyRequested are benign (no relay attempted).
      // A fresh request that didn't relay needs a retry to actually start.
      setRelayFailed(
        json.relayed === false && !json.alreadyExists && !json.alreadyRequested,
      );
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (requested || isBuilding) {
    if (relayFailed) {
      return (
        <div className={cn(glassCard, "overflow-hidden ring-1 ring-amber-200")}>
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-700">
              <Hammer className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Queued — agent relay failed
              </p>
              <p className="text-[11px] text-slate-500">
                {companyName}&apos;s request is saved but the agent wasn&apos;t
                reached. Tap to retry — the build won&apos;t start until it goes
                through.
              </p>
              {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => void build()}
              disabled={loading}
              className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Retrying…" : "Retry"}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className={cn(glassCard, "overflow-hidden")}>
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-700">
            <Loader2 className="size-4 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Demo build requested</p>
            <p className="text-[11px] text-slate-500">
              The agent is building {companyName}&apos;s demo. It&apos;ll appear here
              for review when ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(glassCard, "overflow-hidden ring-1 ring-sky-200")}>
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-700">
          <Hammer className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">No demo yet</p>
          <p className="text-[11px] text-slate-500">
            {companyName} is ready for a demo. Approve to have the agent build one.
          </p>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void build()}
          disabled={loading}
          className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Build demo"}
        </button>
      </div>
    </div>
  );
}
