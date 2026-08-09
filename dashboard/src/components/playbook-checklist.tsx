"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ListChecks, RotateCcw } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { PlaybookItem, Stage } from "@/lib/data";
import { stageTheme } from "@/lib/stages";
import { cn } from "@/lib/utils";

interface PlaybookChecklistProps {
  companyId: string;
  items: PlaybookItem[];
  stages: Stage[];
}

/**
 * pipeline.json is the source of truth for `done`, but ticking boxes while
 * working a client should feel immediate. Overrides live in localStorage,
 * keyed per company, and can be cleared back to the file state.
 */
function storageKey(companyId: string) {
  return `local-launch:playbook:${companyId}`;
}

export function PlaybookChecklist({
  companyId,
  items,
  stages,
}: PlaybookChecklistProps) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Read after mount so server and first client render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(companyId));
      if (raw) setOverrides(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // Corrupt or unavailable storage — fall back to the file state.
    }
  }, [companyId]);

  function toggle(itemId: string, done: boolean) {
    setOverrides((prev) => {
      const next = { ...prev, [itemId]: done };
      try {
        window.localStorage.setItem(storageKey(companyId), JSON.stringify(next));
      } catch {
        // Non-fatal: the toggle still applies for this session.
      }
      return next;
    });
  }

  function reset() {
    setOverrides({});
    try {
      window.localStorage.removeItem(storageKey(companyId));
    } catch {
      // Nothing to do.
    }
  }

  const resolved = useMemo(
    () => items.map((item) => ({ ...item, done: overrides[item.id] ?? item.done })),
    [items, overrides],
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
  const hasOverrides = Object.keys(overrides).length > 0;

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

      {hasOverrides ? (
        <button
          type="button"
          onClick={reset}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 self-start text-xs transition-colors"
        >
          <RotateCcw className="size-3" />
          Reset to pipeline.json
        </button>
      ) : null}
    </div>
  );
}
