// Local-only vault reader. The `fs` module is imported DYNAMICALLY inside each
// function (not at module top-level) so Turbopack's static filesystem tracer
// cannot see it and refuse to build the server bundle. These functions are only
// ever called from routes when NOT running on Vercel (IS_SERVERLESS === false).
//
// M14: a client's vault folder is resolved by EXACT name only (the company id
// slug, or the full company name), never by fuzzy first-word containment — a
// common first word like "Upstate" used to resolve to a different client's
// folder. Every candidate is realpath-resolved, checked to be a real directory
// (not a symlink), and verified to sit inside the configured root, so a
// symlink / `..` / non-directory entry can't leak another client's files.
const VAULT_ROOT = process.env.VAULT_ROOT || "";

export interface VaultResult {
  content?: string;
  vaultFiles?: { name: string; path: string }[];
  error?: string;
}

async function fsMod() {
  return await import("fs");
}
async function pathMod() {
  return await import("path");
}

type DirResolution = { dir: string } | { error: string };

/**
 * Resolve the on-disk directory for a client, or an error. EXACT matches only:
 * a directory whose name equals the company id slug or the full company name
 * (case-insensitive). No fuzzy matching across a client boundary.
 */
async function resolveClientDir(
  companyId: string,
  companyName: string,
): Promise<DirResolution> {
  if (!VAULT_ROOT) return { error: "vault not configured" };
  const fs = await fsMod();
  const path = await pathMod();

  // The id must be a single, safe path segment.
  const seg = String(companyId || "").trim();
  if (!seg || seg === "." || seg === ".." || seg !== path.basename(seg) || path.isAbsolute(seg)) {
    return { error: "invalid company id" };
  }

  let realRoot: string;
  try {
    realRoot = fs.realpathSync(VAULT_ROOT);
    if (!fs.statSync(realRoot).isDirectory()) return { error: "vault root unavailable" };
  } catch {
    return { error: "vault root unavailable" };
  }

  const wanted = new Set(
    [seg, companyName]
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean),
  );

  let entries;
  try {
    entries = fs.readdirSync(realRoot, { withFileTypes: true });
  } catch {
    return { error: "vault root unavailable" };
  }

  // `isDirectory()` on a Dirent reflects lstat — a symlink (even to a dir) is
  // excluded here, which is what we want at a client boundary.
  const hit = entries.find(
    (d) => d.isDirectory() && wanted.has(d.name.trim().toLowerCase()),
  );
  if (!hit) return { error: "no vault folder for this client" };

  const candidate = path.join(realRoot, hit.name);
  let real: string;
  try {
    if (fs.lstatSync(candidate).isSymbolicLink()) {
      return { error: "vault folder is a symlink (refused)" };
    }
    real = fs.realpathSync(candidate);
    if (!fs.statSync(real).isDirectory()) return { error: "vault folder is not a directory" };
  } catch {
    return { error: "no vault folder for this client" };
  }

  // Containment: the resolved real path must live under the resolved root.
  const rel = path.relative(realRoot, real);
  if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {
    return { error: "vault folder escapes root" };
  }
  return { dir: real };
}

export async function readClientFile(
  companyId: string,
  companyName: string,
  file: string,
): Promise<VaultResult> {
  const resolved = await resolveClientDir(companyId, companyName);
  if ("error" in resolved) return { error: resolved.error };
  const fs = await fsMod();
  const path = await pathMod();

  const clean = file.replace(/\.\./g, "").replace(/[^\w\-. ]/g, "").trim();
  if (!clean) return { error: "Invalid file" };
  const full = path.join(resolved.dir, clean);

  let realFull: string;
  try {
    if (fs.lstatSync(full).isSymbolicLink()) return { error: "Invalid file" };
    realFull = fs.realpathSync(full);
  } catch {
    return { error: "File not found" };
  }
  const rel = path.relative(resolved.dir, realFull);
  if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {
    return { error: "Invalid file" };
  }
  try {
    if (!fs.statSync(realFull).isFile()) return { error: "File not found" };
    return { content: fs.readFileSync(realFull, "utf8") };
  } catch {
    return { error: "File not found" };
  }
}

export async function readClientActivity(
  companyId: string,
  companyName: string,
): Promise<VaultResult> {
  if (!VAULT_ROOT) return { vaultFiles: [] };
  const resolved = await resolveClientDir(companyId, companyName);
  if ("error" in resolved) return { vaultFiles: [] };
  const fs = await fsMod();
  try {
    const names = fs
      .readdirSync(resolved.dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith(".md"))
      .map((d) => d.name);
    return { vaultFiles: names.map((n) => ({ name: n, path: `/${n}` })) };
  } catch {
    return { vaultFiles: [] };
  }
}
