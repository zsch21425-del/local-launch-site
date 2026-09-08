"use client";

import { useCallback, useState } from "react";
import {
  Check,
  Loader2,
  Pencil,
  Phone,
  User,
  Tag,
  X,
} from "lucide-react";

import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Cold-call sheet — the fields Zach needs on the phone: owner name, phone,
 * offer tier, and send status. Inline-editable: click a row's pencil to edit,
 * hit check to PATCH to /api/pipeline/leads/[id], X to cancel.
 *
 * This is the "real working dashboard" piece — edits persist to pipeline.json
 * (via Vercel Blob + local file), unlike the localStorage-only playbook.
 */

interface ColdCallSheetProps {
  companyId: string;
  ownerName?: string | null;
  phone?: string;
  email?: string;
  offer?: string | null;
  responseStatus?: string | null;
  demoUrl?: string;
  website?: string;
}

type EditableKey = "ownerName" | "phone" | "email" | "offer" | "responseStatus";

const FIELD_LABELS: Record<EditableKey, string> = {
  ownerName: "Owner / contact",
  phone: "Phone",
  email: "Email",
  offer: "Offer",
  responseStatus: "Status",
};

export function ColdCallSheet(props: ColdCallSheetProps) {
  const { companyId } = props;
  const [editing, setEditing] = useState<EditableKey | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState<EditableKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback((key: EditableKey, current: string) => {
    setDraft(current ?? "");
    setEditing(key);
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    setEditing(null);
    setDraft("");
    setError(null);
  }, []);

  const save = useCallback(
    async (key: EditableKey) => {
      setSaving(key);
      setError(null);
      try {
        const res = await fetch(`/api/pipeline/leads/${companyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { [key]: draft.trim() || null } }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || `save failed (${res.status})`);
        }
        setEditing(null);
        // refresh so the new value is reflected server-side on next navigation
        window.location.reload();
      } catch (e: any) {
        setError(e?.message || "save failed");
      } finally {
        setSaving(null);
      }
    },
    [companyId, draft],
  );

  const rows: { key: EditableKey; value: string; icon: any }[] = [
    { key: "ownerName", value: props.ownerName ?? "", icon: User },
    { key: "phone", value: props.phone ?? "", icon: Phone },
    { key: "email", value: props.email ?? "", icon: null },
    { key: "offer", value: props.offer ?? "", icon: Tag },
    { key: "responseStatus", value: props.responseStatus ?? "", icon: null },
  ];

  return (
    <div className={cn(glassCard, "flex flex-col gap-1 p-5")}>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Cold-call sheet</h2>
        <span className="text-[11px] text-muted-foreground">tap ✎ to edit</span>
      </div>

      {error ? (
        <p className="mb-1 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{error}</p>
      ) : null}

      <dl className="flex flex-col">
        {rows.map(({ key, value, icon: Icon }) => {
          const isEditing = editing === key;
          const isSaving = saving === key;
          return (
            <div
              key={key}
              className="group flex items-center gap-2 border-b border-border py-2 last:border-0"
            >
              <div className="flex w-28 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                {FIELD_LABELS[key]}
              </div>

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save(key);
                      if (e.key === "Escape") cancel();
                    }}
                    className="w-full rounded-md border border-primary bg-card px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                  />
                ) : (
                  <span
                    className={cn(
                      "block truncate text-sm",
                      value ? "text-foreground" : "text-muted-foreground/60 italic",
                    )}
                  >
                    {value || "—"}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => save(key)}
                      disabled={isSaving}
                      className="rounded p-1 text-primary hover:bg-primary/10 disabled:opacity-40"
                      aria-label={`Save ${FIELD_LABELS[key]}`}
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancel}
                      className="rounded p-1 text-muted-foreground hover:bg-muted"
                      aria-label="Cancel"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(key, value)}
                    className="rounded p-1 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground group-hover:opacity-100"
                    aria-label={`Edit ${FIELD_LABELS[key]}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </dl>

      {props.demoUrl || props.website ? (
        <a
          href={props.demoUrl || props.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Open demo ↗
        </a>
      ) : null}
    </div>
  );
}
