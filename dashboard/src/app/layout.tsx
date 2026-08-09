import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";

import { SidebarNav } from "@/components/sidebar-nav";
import { getAgency } from "@/lib/data";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const agency = getAgency();

export const metadata: Metadata = {
  title: `${agency.name} — Client Pipeline`,
  description: agency.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full bg-slate-100 font-sans text-slate-800">
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
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-xs text-slate-400 transition-colors hover:text-slate-600 sm:block"
              >
                {agency.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-100 px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
            Pipeline data from{" "}
            <code className="text-slate-500">data/pipeline.json</code>
          </footer>
        </div>
      </body>
    </html>
  );
}
