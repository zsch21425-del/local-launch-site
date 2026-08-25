"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Stage } from "@/lib/data";

const FIELD =
  "w-full rounded-lg border border-slate-900/10 bg-white/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none";

/**
 * Add a new lead. Phase 2 (B1): posts to /api/pipeline/leads (writes Vercel Blob),
 * then calls onAdded() so the parent's usePipeline().reload() refreshes the board.
 * Replaces the old "copy JSON into pipeline.json" flow (that path no longer works —
 * the app reads Blob, not a bundled file).
 */
export function AddLeadDialog({
  stages,
  onAdded,
}: {
  stages: Stage[];
  onAdded?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [dupe, setDupe] = React.useState<{ companyId: string; name: string } | null>(null);

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [location, setLocation] = React.useState("Greenville, SC");
  const [phone, setPhone] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [stage, setStage] = React.useState(stages.find((s) => s.id === "prospect")?.id ?? stages[0]?.id ?? "prospect");
  const [summary, setSummary] = React.useState("");

  async function submit() {
    if (!name.trim()) {
      setFeedback({ kind: "error", text: "Business name is required." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    setDupe(null);
    try {
      const res = await fetch("/api/pipeline/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          location: location.trim(),
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          priority,
          stage,
          summary: summary.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setDupe({ companyId: data.companyId ?? "", name: data.name ?? name });
        setFeedback({ kind: "error", text: "Already in the dashboard." });
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setFeedback({ kind: "ok", text: "Lead added." });
      setName("");
      setCategory("");
      setLocation("Greenville, SC");
      setPhone("");
      setWebsite("");
      setSummary("");
      onAdded?.();
      window.setTimeout(() => setOpen(false), 600);
    } catch (e) {
      setFeedback({ kind: "error", text: e instanceof Error ? e.message : "Could not add lead." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFeedback(null);
          setSubmitting(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-1.5 rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-800">
          <Plus className="size-4" />
          Add new lead
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a new lead</DialogTitle>
          <DialogDescription>
            Saves straight to the live dashboard (Vercel Blob). It appears on Leads and search immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business name">
            <input
              className={FIELD}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Palmetto Roofing"
            />
          </Field>
          <Field label="Category">
            <input
              className={FIELD}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Roofing Contractor"
            />
          </Field>
          <Field label="Location">
            <input
              className={FIELD}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={FIELD}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(864) 555-0100"
            />
          </Field>
          <Field label="Website">
            <input
              className={FIELD}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="none yet"
            />
          </Field>
          <Field label="Priority">
            <select
              className={FIELD}
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="high">High</option>
              <option value="medium-high">Medium-High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
          <Field label="Stage" className="sm:col-span-2">
            <select
              className={FIELD}
              value={stage}
              onChange={(event) => setStage(event.target.value as typeof stage)}
            >
              {stages.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Summary" className="sm:col-span-2">
            <textarea
              className={`${FIELD} min-h-20 resize-y`}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="What they do, where they're weak, why they're a fit."
            />
          </Field>
        </div>

        {feedback ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              feedback.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {dupe && feedback.kind === "error" && dupe.companyId ? (
              <>
                Already in the dashboard —{" "}
                <a href={`/client/${dupe.companyId}`} className="underline underline-offset-2">
                  view {dupe.name}
                </a>
              </>
            ) : (
              feedback.text
            )}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="gap-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => void submit()}
            disabled={submitting}
          >
            {submitting ? "Saving…" : (
              <>
                <Check className="size-4" />
                Save lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
