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
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-primary/20 bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Local Launch OS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 4-digit access code
          </p>
          {nextPath !== "/" ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              After sign-in → {nextPath}
            </p>
          ) : null}
        </div>
        <label htmlFor="access-code" className="sr-only">
          Access code
        </label>
        <input
          id="access-code"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Access code"
          autoFocus
          aria-invalid={!!error}
          aria-describedby={error ? "login-error" : undefined}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {error ? (
          <p id="login-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !token.trim()}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
