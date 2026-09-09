"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  Home,
  KanbanSquare,
  Menu,
  MonitorPlay,
  Radar,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

import { GlobalSearch } from "@/components/global-search";
import { usePipeline } from "@/hooks/use-pipeline";
import { getAgency, pendingApprovalCount, pendingDemoCount } from "@/lib/data";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/fleet", label: "Fleet", icon: Cpu },
  { href: "/leads", label: "Leads", icon: Radar },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/demos", label: "Demos", icon: MonitorPlay },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/automation", label: "Automation", icon: Workflow },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Left navigation rail. Desktop: icon-only 56px rail that expands to show
 * labels on toggle. Mobile: hidden behind a hamburger, slides in as an
 * overlay so it never competes with page content for space.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const { companies, agency: liveAgency } = usePipeline();
  const agency = liveAgency?.name ? liveAgency : getAgency();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = pendingApprovalCount(companies);
  const demoCount = pendingDemoCount(companies);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed top-3 left-3 z-30 grid size-10 place-items-center rounded-lg border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur-xl sm:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            aria-hidden
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/30"
          />
          <nav className="relative z-10 flex h-full w-64 flex-col gap-1 border-r border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between px-1 py-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {agency.name}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
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
                badge={item.href === "/approvals" ? pendingCount : item.href === "/demos" ? demoCount : undefined}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      ) : null}

      <nav
        className={cn(
          "sticky top-0 z-20 hidden h-svh shrink-0 flex-col gap-1 border-r border-border/70 bg-card/90 py-3 backdrop-blur-md transition-[width] duration-200 sm:flex",
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
            <span className="truncate text-sm font-semibold text-foreground">
              {agency.name}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            badge={item.href === "/approvals" ? pendingCount : item.href === "/demos" ? demoCount : undefined}
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
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-[18px]" aria-hidden />
        {badge ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      {expanded ? (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate">{item.label}</span>
          {badge ? (
            <span className="tnum ml-auto shrink-0 rounded-full bg-destructive/12 px-1.5 py-0.5 text-[10px] font-bold text-destructive ring-1 ring-inset ring-destructive/20">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
