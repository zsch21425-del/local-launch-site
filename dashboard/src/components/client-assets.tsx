"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, FolderOpen, RefreshCw } from "lucide-react";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface VaultFile {
  name: string;
  path: string;
}

/** Standalone vault asset gallery — renders ONLY the client's work files.
 * Fetch: /api/client/activity (returns vaultFiles in the same payload as events). */
export function ClientAssets({ companyId }: { companyId: string }) {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/client/activity?companyId=${encodeURIComponent(companyId)}`);
      const d = await r.json();
      if (r.status === 503 || d.error === "local-only") {
        setError("local-only");
        setFiles([]);
        return;
      }
      if (!r.ok) throw new Error(d.error || "Failed to load assets");
      setFiles(d.vaultFiles ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={cn(glass, "rounded-xl p-5")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FolderOpen className="size-4 text-[#2AA8A8]" /> Assets & Work Files
          {files.length > 0 && <span className="text-xs font-normal text-slate-400">({files.length})</span>}
        </h2>
        <button onClick={load} className="text-xs text-slate-400 hover:text-slate-600" aria-label="Refresh assets">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {error === "local-only" ? (
        <p className="text-sm text-slate-400 py-2">Work files are available on the local dashboard only (vault lives on the office machine).</p>
      ) : error ? (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      ) : null}
      {loading && files.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">Loading assets…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">No work files in the vault for this client yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {files.map((f) => (
            <li key={f.name}>
              <a
                href={`/api/client/file?companyId=${encodeURIComponent(companyId)}&file=${encodeURIComponent(f.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-[#2AA8A8]/40 hover:bg-slate-100 transition-colors"
                title={f.name}
              >
                <FileText className="size-4 shrink-0 text-[#2AA8A8]" />
                <span className="truncate font-medium">{f.name.replace(/\.md$/, "")}</span>
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-slate-400">md</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
