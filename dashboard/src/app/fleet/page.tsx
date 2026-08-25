"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, Clock, Cpu, Radio, Send, Terminal } from "lucide-react";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface AgentStatus {
  name: string; label: string; role: string; port: number;
  online: boolean; gatewayState: string | null; activeAgents: number | null;
  platforms: any; updatedAt: string | null;
}
interface AgentTask { name: string; label: string; ok: boolean; task: string | null; error?: string | null; }
interface ActivityEvent { ts: number; agent: string; label: string; direction: string; peer: string; summary: string; }
interface CronAgent { name: string; label: string; jobCount: number; recentRuns: any[]; }

const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const fmtAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts * 1000) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

export default function FleetPage() {
  const [status, setStatus] = useState<AgentStatus[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [cron, setCron] = useState<CronAgent[]>([]);
  const [dispatchAgent, setDispatchAgent] = useState("local-launch-supervisor");
  const [dispatchMsg, setDispatchMsg] = useState("");
  const [dispatchReply, setDispatchReply] = useState("");
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [panelErrors, setPanelErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const errors: Record<string, string> = {};
    const updates: Record<string, string> = {};

    // Independent per-panel fetches so one failure never blanks the others.
    const fetchPanel = async (key: string, url: string, setter: (d: any) => void) => {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        setter(d);
        updates[key] = now;
      } catch (e: any) {
        errors[key] = e.message || "Failed to load";
      }
    };

    await Promise.all([
      fetchPanel("status", "/api/fleet/status", (d) => setStatus(d.agents ?? [])),
      fetchPanel("tasks", "/api/fleet/tasks", (d) => setTasks(d.agents ?? [])),
      fetchPanel("activity", "/api/fleet/activity?limit=40", (d) => setActivity(d.events ?? [])),
      fetchPanel("cron", "/api/fleet/cron", (d) => setCron(d.agents ?? [])),
    ]);

    setPanelErrors(errors);
    setLastUpdated((prev) => ({ ...prev, ...updates }));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  const dispatch = async () => {
    if (!dispatchMsg.trim() || dispatchBusy) return;
    setDispatchBusy(true);
    setDispatchReply("");
    try {
      const r = await fetch("/api/fleet/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: dispatchAgent, message: dispatchMsg.trim() }),
      });
      const d = await r.json();
      setDispatchReply(d.reply || d.error || "(no reply)");
    } catch (e: any) {
      setDispatchReply(`Error: ${e.message}`);
    } finally {
      setDispatchBusy(false);
    }
  };

  const onlineCount = status.filter((a) => a.online).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
              <Terminal className="text-[#2AA8A8]" /> Fleet Command Center
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {onlineCount}/{status.length} agents online · {activity.length} recent actions · auto-refresh 30s
            </p>
          </div>
          <button onClick={refresh} className={cn(glass, "px-4 py-2 rounded-lg text-sm hover:bg-slate-100")}>
            ⟳ Refresh
          </button>
        </div>

        {/* Per-panel error strip — a panel that failed shows here, others stay live */}
        {Object.keys(panelErrors).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(panelErrors).map(([k, v]) => (
              <span key={k} className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                {k}: {v}
              </span>
            ))}
          </div>
        )}

        {/* PANEL 1 — Fleet Status Grid */}
        <section className={cn(glass, "rounded-xl p-5")}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
            <Cpu className="w-4 h-4 text-[#2AA8A8]" /> Agent Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {status.map((a) => (
              <div key={a.name} className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.label}</span>
                  <span className={cn("w-2.5 h-2.5 rounded-full", a.online ? "bg-emerald-400" : "bg-red-500")} />
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.role}</p>
                <div className="text-xs text-slate-500 mt-3 space-y-1">
                  <div className="flex justify-between"><span>State</span><span>{a.gatewayState ?? "—"}</span></div>
                  <div className="flex justify-between"><span>Agents</span><span>{a.activeAgents ?? "—"}</span></div>
                  <div className="flex justify-between"><span>Heartbeat</span><span>{fmtTime(a.updatedAt)}</span></div>
                  <div className="flex justify-between"><span>Port</span><span className="font-mono">{a.port}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 2 — Current Tasks */}
        <section className={cn(glass, "rounded-xl p-5")}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
            <Radio className="w-4 h-4 text-[#2AA8A8]" /> What Each Agent Is Doing Now
          </h2>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.name} className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                <Bot className="w-4 h-4 text-[#2AA8A8] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-800">{t.label}</span>
                  <p className="text-sm text-slate-600 line-clamp-2">{t.task ?? (t.error ? `⚠ ${t.error}` : "idle")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 3 — Dispatch */}
        <section className={cn(glass, "rounded-xl p-5")}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
            <Send className="w-4 h-4 text-[#2AA8A8]" /> Dispatch Work
          </h2>
          <div className="flex gap-3 flex-wrap">
            <select
              value={dispatchAgent}
              onChange={(e) => setDispatchAgent(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
            >
              {status.map((a) => (
                <option key={a.name} value={a.name}>{a.label}</option>
              ))}
            </select>
            <input
              value={dispatchMsg}
              onChange={(e) => setDispatchMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && dispatch()}
              placeholder='e.g. "Check reviews for Redwood" or "Draft a pitch for Chandler Bros"'
              className="flex-1 min-w-[280px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
            />
            <button
              onClick={dispatch}
              disabled={dispatchBusy || !dispatchMsg.trim()}
              className="px-4 py-2 rounded-lg bg-[#2AA8A8]/20 border border-[#2AA8A8]/40 text-sm hover:bg-[#2AA8A8]/30 disabled:opacity-40"
            >
              {dispatchBusy ? "Sending…" : "Send"}
            </button>
          </div>
          {dispatchReply && (
            <div className="mt-3 rounded-lg bg-black/30 border border-white/10 p-3 text-sm whitespace-pre-wrap max-h-48 overflow-auto">
              {dispatchReply}
            </div>
          )}
        </section>

        {/* PANEL 4 — Activity Feed */}
        <section className={cn(glass, "rounded-xl p-5")}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
            <Activity className="w-4 h-4 text-[#2AA8A8]" /> Fleet Activity
          </h2>
          <div className="space-y-1 max-h-96 overflow-auto">
            {activity.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm py-1 border-b border-slate-100">
                <span className="text-slate-500 text-xs mt-1 shrink-0 w-14 text-right">{fmtAgo(e.ts)}</span>
                <span className="text-slate-400 shrink-0">{e.direction === "inbound" ? "←" : "→"}</span>
                <span className="font-medium text-[#2AA8A8] shrink-0">{e.label.split(" ")[0]}</span>
                <span className="text-slate-600 line-clamp-2">{e.summary}</span>
              </div>
            ))}
            {activity.length === 0 && <p className="text-slate-400 text-sm">No activity yet.</p>}
          </div>
        </section>

        {/* PANEL 5 — Cron Last Runs */}
        <section className={cn(glass, "rounded-xl p-5")}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
            <Clock className="w-4 h-4 text-[#2AA8A8]" /> Automated Jobs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {cron.filter((a) => a.jobCount > 0).map((a) => (
              <div key={a.name} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{a.label}</span>
                  <span className="text-slate-500">{a.jobCount} jobs</span>
                </div>
                {a.recentRuns.slice(0, 3).map((j, i) => (
                  <div key={i} className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span className="truncate pr-2">{j.name}</span>
                    <span className={cn(j.lastStatus === "ok" ? "text-emerald-400" : "text-red-400")}>
                      {j.lastStatus}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {loading && <p className="text-slate-400 text-center py-8">Loading fleet…</p>}
      </div>
    </div>
  );
}
