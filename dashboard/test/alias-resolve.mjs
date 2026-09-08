// Resolver hook: map the "@/..." tsconfig path alias to ./src/... so the pure
// library modules can be loaded by `node --test` without a bundler. Node's
// built-in TS type-stripping handles the .ts extension.
import { pathToFileURL } from "node:url";
import path from "node:path";

const srcRoot = path.resolve(import.meta.dirname, "..", "src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = path.join(srcRoot, specifier.slice(2));
    if (!path.extname(target)) target += ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}

// data.ts does `import x from "...json"` (bundler-style, no import attribute);
// Node ESM requires `with { type: "json" }`, so inject it here.
export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    return nextLoad(url, {
      ...context,
      importAttributes: { ...context.importAttributes, type: "json" },
    });
  }
  return nextLoad(url, context);
}
