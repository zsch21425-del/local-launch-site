"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GlobalSearch } from "@/components/global-search";
import { SidebarNav } from "@/components/sidebar-nav";
import { getAgency } from "@/lib/data";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const agency = getAgency();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <main className="min-h-full flex-1">{children}</main>;
  }

  return (
    <>
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/65 backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 pl-14 sm:px-6 sm:pl-6 lg:px-8">
            <Link
              href="/"
              className="rounded-md text-sm font-semibold tracking-tight text-slate-800 outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/50"
            >
              {agency.name}
            </Link>
            <GlobalSearch className="hidden max-w-sm flex-1 sm:block" />
            <a
              href={agency.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-xs text-slate-400 transition-colors hover:text-slate-600 lg:block"
            >
              {agency.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-100 px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
          Local Launch OS · Simpsonville, SC
        </footer>
      </div>
    </>
  );
}
