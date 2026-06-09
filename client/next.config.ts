import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required for Docker deployment — produces .next/standalone
  output: 'standalone',
  // Pin the workspace root to THIS project. A stray pnpm-lock.yaml in a parent
  // directory made Next infer the wrong root (breaking middleware resolution).
  turbopack: {
    root: path.join(__dirname),
  },
  // For App Router, body size limits are handled via route segment config
  // See src/app/api/media/route.ts for maxDuration configuration
};

export default nextConfig;
