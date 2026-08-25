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
        setError(d.error || "Invalid code");
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
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 space-y-5 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Lock className="size-5 text-emerald-700" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Local Launch OS</h1>
          <p className="text-sm text-slate-500 mt-1">Enter the 4-digit access code</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Access code"
          autoFocus
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !token.trim()}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
