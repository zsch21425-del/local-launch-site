import Link from "next/link";
import { CheckCircle2, CircleDot, ListTodo } from "lucide-react";

import type { OpenTask } from "@/lib/data";
import { priorityTheme } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * The next unchecked playbook step for each client, highest priority first.
 * Deliberately one task per client — this is a "what do I do now" list, not a
 * backlog dump.
 */
export function TodaysTasks({
  tasks,
  className,
}: {
  tasks: OpenTask[];
  className?: string;
}) {
  return (
    <section className={cn(glass, "flex flex-col p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
            <ListTodo className="size-4 text-slate-500" aria-hidden />
            Today&apos;s tasks
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Next open step per client
          </p>
        </div>
        <span className="tnum rounded-full bg-slate-900/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-900/10 py-8 text-center">
          <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />
          <p className="text-sm font-medium text-slate-700">
            Every playbook step is done.
          </p>
          <p className="text-xs text-slate-500">Time to add more leads.</p>
        </div>
      ) : (
        <ol className="mt-4 flex flex-col divide-y divide-slate-900/[0.06]">
          {tasks.map((task) => {
            const theme = priorityTheme(task.priority);
            return (
              <li key={`${task.companyId}-${task.item.id}`}>
                <Link
                  href={`/client/${task.companyId}`}
                  className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/60"
                >
                  <CircleDot
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      theme.dot.replace("bg-", "text-"),
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-medium text-slate-800 group-hover:text-emerald-700">
                      {task.item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {task.companyName}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      theme.badge,
                    )}
                  >
                    {task.priority.split("-")[0].toUpperCase()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
