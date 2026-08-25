// Local-only vault reader. The `fs` module is imported DYNAMICALLY inside each
// function (not at module top-level) so Turbopack's static filesystem tracer
// cannot see it and refuse to build the server bundle. These functions are only
// ever called from routes when NOT running on Vercel (IS_SERVERLESS === false).
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

export async function readClientFile(companyId: string, companyName: string, file: string): Promise<VaultResult> {
  if (!VAULT_ROOT) return { error: "vault not configured" };
  const fs = await fsMod();
  const path = await pathMod();
  let dir = path.join(VAULT_ROOT, companyId);
  try {
    fs.readdirSync(dir);
  } catch {
    const all = fs.readdirSync(VAULT_ROOT);
    const match = all.find(
      (n: string) =>
        n.toLowerCase() === companyId.toLowerCase() ||
        n.toLowerCase().includes(companyName.toLowerCase().split(" ")[0].toLowerCase()),
    );
    dir = match ? path.join(VAULT_ROOT, match) : dir;
  }
  const clean = file.replace(/[^\w\-. ]/g, "").replace(/\.\./g, "");
  const full = path.join(dir, clean);
  if (!full.startsWith(dir)) return { error: "Invalid file" };
  try {
    return { content: fs.readFileSync(full, "utf8") };
  } catch {
    return { error: "File not found" };
  }
}

export async function readClientActivity(companyId: string, companyName: string): Promise<VaultResult> {
  if (!VAULT_ROOT) return { vaultFiles: [] };
  const fs = await fsMod();
  const path = await pathMod();
  let slugDir = path.join(VAULT_ROOT, companyId);
  let vaultFiles: { name: string; path: string }[] = [];
  try {
    let dir = slugDir;
    try {
      fs.readdirSync(dir);
    } catch {
      const all = fs.readdirSync(VAULT_ROOT);
      const match = all.find(
        (n: string) =>
          n.toLowerCase() === companyId.toLowerCase() ||
          n.toLowerCase().includes(companyName.toLowerCase().split(" ")[0].toLowerCase()),
      );
      dir = match ? path.join(VAULT_ROOT, match) : dir;
    }
    slugDir = dir;
    const names = fs.readdirSync(slugDir).filter((n: string) => n.endsWith(".md"));
    vaultFiles = names.map((n: string) => ({ name: n, path: `/${n}` }));
  } catch {
    /* no vault dir */
  }
  return { vaultFiles };
}
