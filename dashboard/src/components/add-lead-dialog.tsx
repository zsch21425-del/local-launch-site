"use client";

import * as React from "react";
import { Check, Copy, Plus } from "lucide-react";

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
 * The pipeline is a static JSON import, so a new lead can't be written from the
 * browser. This composes the exact `companies[]` entry to paste into
 * `data/pipeline.json` — one copy, one commit, and the board picks it up.
 */
export function AddLeadDialog({ stages }: { stages: Stage[] }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [location, setLocation] = React.useState("Greenville, SC");
  const [phone, setPhone] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [stage, setStage] = React.useState(stages[0]?.id ?? "prospected");
  const [summary, setSummary] = React.useState("");

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-lead";

  const snippet = JSON.stringify(
    {
      id: slug,
      name: name || "New Lead",
      category: category || "Uncategorized",
      stage,
      location,
      phone,
      website,
      summary,
      lastContact: "",
      lastUpdated: "",
      priority,
      playbook: [
        {
          id: `${slug}-contact`,
          label: "Make initial contact",
          stage: "prospected",
          done: false,
          detail: phone ? `Call ${phone}.` : "Find a phone number and call.",
        },
      ],
      nextSteps: ["Make initial contact"],
      seoScore: null,
    },
    null,
    2,
  );

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCopied(false);
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
            Fill this in and copy the generated entry into the{" "}
            <code className="rounded bg-slate-900/[0.06] px-1 py-0.5 text-[11px] text-slate-700">
              companies
            </code>{" "}
            array in <code className="rounded bg-slate-900/[0.06] px-1 py-0.5 text-[11px] text-slate-700">data/pipeline.json</code>.
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
              onChange={(event) =>
                setStage(event.target.value as typeof stage)
              }
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

        <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900/[0.04] p-3 font-mono text-[11px] leading-relaxed text-slate-700">
          {snippet}
        </pre>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="gap-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            onClick={copySnippet}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy JSON entry
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
