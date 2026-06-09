import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // NOTE: `output: 'standalone'` removed — it's a Docker/self-hosting setting
  // that breaks Vercel's per-route serverless function build (caused /api/* 404s).
  // Pin the workspace root to THIS project. A stray pnpm-lock.yaml in a parent
  // directory made Next infer the wrong root (breaking middleware resolution).
  turbopack: {
    root: path.join(__dirname),
  },
  // For App Router, body size limits are handled via route segment config
  // See src/app/api/media/route.ts for maxDuration configuration
};

export default nextConfig;
