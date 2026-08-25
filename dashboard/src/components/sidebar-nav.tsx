"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  KanbanSquare,
  Menu,
  MonitorPlay,
  Radar,
  Search,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { getAgency, getCompanies, pendingDemoCount } from "@/lib/data";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Pipeline", icon: KanbanSquare },
  { href: "/fleet", label: "Fleet", icon: Cpu },
  { href: "/leads", label: "Leads", icon: Radar },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/demos", label: "Demos", icon: MonitorPlay },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

/** Global company lookup — type a name and jump straight to its profile, or
 * see instantly that it is NOT in the dashboard yet. */
function GlobalSearch() {
  const router = useRouter();
  const companies = getCompanies();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = q.trim()
    ? companies
        .filter((c) => {
          const t = q.toLowerCase();
          return (
            c.name.toLowerCase().includes(t) ||
            (c.category ?? "").toLowerCase().includes(t) ||
            (c.location ?? "").toLowerCase().includes(t)
          );
        })
        .slice(0, 8)
    : [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Find a company…"
          className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      {open && q.trim() ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">
              Not in the dashboard yet.
            </p>
          ) : (
            matches.map((c) => (
              <button
                key={c.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  router.push(`/company/${c.id}`);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="truncate font-medium text-slate-700">{c.name}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-slate-400">
                  {c.stage}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function pendingApprovalCount(): number {
  const companies = getCompanies();
  return companies.filter(
    (c) => c.pitchDraft?.status === "pending" && c.stage === "pitch",
  ).length;
}

function pendingDemoCount_(): number {
  return pendingDemoCount(getCompanies());
}

/**
 * Left navigation rail. Desktop: icon-only 56px rail that expands to show
 * labels on toggle. Mobile: hidden behind a hamburger, slides in as an
 * overlay so it never competes with page content for space.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const agency = getAgency();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = pendingApprovalCount();

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed top-3 left-3 z-30 grid size-10 place-items-center rounded-lg border border-slate-300 bg-white/90 text-slate-600 shadow-sm backdrop-blur-xl sm:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            aria-hidden
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <nav className="relative z-10 flex h-full w-64 flex-col gap-1 border-r border-slate-300 bg-white p-3">
            <div className="mb-2 flex items-center justify-between px-1 py-2">
              <span className="truncate text-sm font-semibold text-slate-900">
                {agency.name}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>
            <GlobalSearch />

            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                expanded
                badge={item.href === "/approvals" ? pendingCount : item.href === "/demos" ? pendingDemoCount_() : undefined}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      ) : null}

      <nav
        className={cn(
          "sticky top-0 z-20 hidden h-svh shrink-0 flex-col gap-1 border-r border-slate-300 bg-white/85 py-3 backdrop-blur-xl transition-[width] duration-200 sm:flex",
          collapsed ? "w-14 px-2" : "w-56 px-3",
        )}
      >
        <div
          className={cn(
            "mb-2 flex items-center",
            collapsed ? "justify-center" : "justify-between px-1",
          )}
        >
          {!collapsed ? (
            <span className="truncate text-sm font-semibold text-slate-900">
              {agency.name}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>

        {!collapsed ? <GlobalSearch /> : null}

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            expanded={!collapsed}
            badge={item.href === "/approvals" ? pendingCount : item.href === "/demos" ? pendingDemoCount_() : undefined}
          />
        ))}
      </nav>
    </>
  );
}

function NavLink({
  item,
  active,
  expanded,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        !expanded && "justify-center",
        active
          ? "bg-emerald-500/10 text-emerald-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-[18px]" aria-hidden />
        {badge ? (
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      {expanded ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}
