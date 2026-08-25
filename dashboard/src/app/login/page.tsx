"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Invalid token");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#2AA8A8]/15 border border-[#2AA8A8]/30">
            <Lock className="size-5 text-[#2AA8A8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Local Launch OS</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your dashboard token to continue</p>
        </div>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Dashboard token"
          autoFocus
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2AA8A8]/50 focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !token.trim()}
          className="w-full rounded-lg bg-[#2AA8A8]/20 border border-[#2AA8A8]/40 py-2.5 text-sm font-medium text-[#2AA8A8] hover:bg-[#2AA8A8]/30 disabled:opacity-40 transition-colors"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
