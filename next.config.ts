import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @electric-sql/pglite is WASM-based and loads its assets via paths
  // derived from import.meta.url — Turbopack's server bundling rewrites
  // those in a way PGlite's loader can't handle (surfaces as "path
  // argument must be of type string... Received an instance of URL" on
  // every query). Run it via native Node `require` instead of bundling it.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
