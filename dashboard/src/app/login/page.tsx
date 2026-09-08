"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

/**
 * Login — sets ll_dash_auth cookie then hard-navigates to ?next= path.
 * Hard navigation (not router.push) so the cookie is definitely attached
 * on the next document request (fixes "login then every tab asks again").
 */
export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const n = sp.get("next");
      if (n && n.startsWith("/") && !n.startsWith("//")) {
        setNextPath(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Invalid code");
        setBusy(false);
        return;
      }
      // Full page load so middleware sees the new cookie on the target route.
      window.location.assign(nextPath || "/");
    } catch (err: any) {
      setError(err?.message || "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
            <Lock className="size-5 text-emerald-700" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Local Launch OS</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 4-digit access code
          </p>
          {nextPath !== "/" ? (
            <p className="mt-1 text-[11px] text-slate-400">
              After sign-in → {nextPath}
            </p>
          ) : null}
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
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !token.trim()}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
