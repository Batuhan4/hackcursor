import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cursor SDK ships a Node.js runtime and native dependencies that must be
  // resolved by Node instead of being bundled by Turbopack.
  serverExternalPackages: ["@cursor/sdk"],
  // Pin the workspace root: stray lockfiles outside the repo must not
  // change how Vercel/local builds resolve the project.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
