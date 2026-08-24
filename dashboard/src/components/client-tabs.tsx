"use client";

import { useState, useCallback, useEffect } from "react";
import { Activity, FolderOpen, LayoutGrid, ListChecks, MessageSquare, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

/** Light-weight tab bar for the client workstation. */
export function ClientTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: <LayoutGrid className="size-3.5" /> },
    { id: "playbook", label: "Playbook", icon: <ListChecks className="size-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="size-3.5" /> },
    { id: "assets", label: "Assets", icon: <FolderOpen className="size-3.5" /> },
    { id: "chat", label: "Chat", icon: <MessageSquare className="size-3.5" /> },
  ];
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === t.id
              ? "bg-[#2AA8A8]/15 text-[#2AA8A8]"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
