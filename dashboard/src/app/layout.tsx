import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AppChrome } from "@/components/app-chrome";
import { getAgency } from "@/lib/data";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const agency = getAgency();

export const metadata: Metadata = {
  title: `${agency.name} OS`,
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
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
