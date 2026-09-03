import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppChrome } from "@/components/app-chrome";
import { getAgency } from "@/lib/data";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full bg-background font-sans text-foreground">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
