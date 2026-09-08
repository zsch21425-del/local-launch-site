"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ListChecks, TriangleAlert } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { invalidatePipeline } from "@/hooks/use-pipeline";
import type { PlaybookItem, Stage } from "@/lib/data";
import { stageTheme } from "@/lib/stages";
import { cn } from "@/lib/utils";

interface PlaybookChecklistProps {
  companyId: string;
  items: PlaybookItem[];
  stages: Stage[];
}

/**
 * pipeline.json is the source of truth for `done` (M08). Ticking a box POSTs to
 * /api/pipeline/playbook (atomic mutatePipeline write) so every device, agent
 * and report sees the same completion state. `pending` is a purely local
 * optimistic overlay: it shows the new checkbox value while the write is in
 * flight, is reconciled away by router.refresh() on success, reverts on
 * failure, and is dropped entirely when the company changes.
 */
export function PlaybookChecklist({
  companyId,
  items,
  stages,
}: PlaybookChecklistProps) {
  const router = useRouter();
  /** itemId -> optimistic `done` value while its write is in flight. */
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Switching to another client must not carry over this client's optimistic
  // state or a stale error.
  useEffect(() => {
    setPending({});
    setSaveError(null);
  }, [companyId]);

  async function toggle(itemId: string, done: boolean) {
    setSaveError(null);
    setPending((prev) => ({ ...prev, [itemId]: done }));
    try {
      const res = await fetch("/api/pipeline/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, itemId, done }),
      });
      if (!res.ok) {
        const msg = (
          await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        ).error;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      // Pull the authoritative server state back into the page; keep the
      // optimistic value until the refreshed props land so the box doesn't flip.
      router.refresh();
      // Keep the shared client cache (stats, open-tasks, other views) in step.
      void invalidatePipeline();
      setPending((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (e) {
      setPending((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      setSaveError(
        e instanceof Error ? e.message : "Could not save that step. Try again.",
      );
    }
  }

  const resolved = useMemo(
    () => items.map((item) => ({ ...item, done: pending[item.id] ?? item.done })),
    [items, pending],
  );

  const groups = useMemo(
    () =>
      stages
        .map((stage) => ({
          stage,
          items: resolved.filter((item) => item.stage === stage.id),
        }))
        .filter((group) => group.items.length > 0),
    [resolved, stages],
  );

  const total = resolved.length;
  const done = resolved.filter((item) => item.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  if (total === 0) {
    return (
      <div className="border-border/60 flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
        <ListChecks className="text-muted-foreground size-6" />
        <p className="text-muted-foreground text-sm">No steps yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            <span className="text-foreground font-semibold tabular-nums">
              {done}
            </span>{" "}
            of {total} complete
          </span>
          <span className="text-sm font-semibold tabular-nums">{percent}%</span>
        </div>
        <Progress value={percent} />
      </div>

      {saveError ? (
        <p className="text-destructive flex items-center gap-1.5 text-xs">
          <TriangleAlert className="size-3.5 shrink-0" />
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const theme = stageTheme(group.stage.color);
          const groupDone = group.items.filter((item) => item.done).length;

          return (
            <section key={group.stage.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", theme.dot)} />
                <h3 className={cn("text-xs font-semibold tracking-wide uppercase", theme.text)}>
                  {group.stage.label}
                </h3>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {groupDone}/{group.items.length}
                </span>
              </div>

              <ul className={cn("flex flex-col gap-1 border-l pl-3", theme.border)}>
                {group.items.map((item) => {
                  const isOpen = expanded[item.id] ?? false;
                  const hasDetail = Boolean(item.detail);

                  return (
                    <li key={item.id} className="rounded-lg">
                      <div className="hover:bg-accent/40 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors">
                        <Checkbox
                          id={`${companyId}-${item.id}`}
                          checked={item.done}
                          disabled={item.id in pending}
                          onCheckedChange={(checked) =>
                            toggle(item.id, checked === true)
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`${companyId}-${item.id}`}
                            className={cn(
                              "block cursor-pointer text-sm leading-snug",
                              item.done && "text-muted-foreground line-through",
                            )}
                          >
                            {item.label}
                          </label>
                          {hasDetail && isOpen ? (
                            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                        {hasDetail ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((prev) => ({
                                ...prev,
                                [item.id]: !isOpen,
                              }))
                            }
                            aria-expanded={isOpen}
                            aria-label={
                              isOpen
                                ? `Hide details for ${item.label}`
                                : `Show details for ${item.label}`
                            }
                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 mt-0.5 shrink-0 rounded p-0.5 transition-colors outline-none focus-visible:ring-[3px]"
                          >
                            <ChevronDown
                              className={cn(
                                "size-4 transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
