import type { NextConfig } from "next";

// This app is a subdirectory of the larger LocalLaunch repo, which has its own
// package-lock.json one level up. With no explicit root, Turbopack's dev tracer
// and the build file-tracer walk the whole parent project — the dynamic `fs`
// imports in src/lib/vault-reader.ts trigger a repo-wide trace and a noisy
// "inferred workspace root" warning. Pin both roots to this directory.
const projectRoot = import.meta.dirname;

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
