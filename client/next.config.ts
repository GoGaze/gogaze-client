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

  // Allow next/image to optimize media thumbnails from these origins. The S3
  // bucket host is `<bucket>.s3.<region>.amazonaws.com` (bucket name has a
  // random suffix), so the `**.amazonaws.com` wildcard covers it regardless of
  // bucket/region. gazecontrol.in covers the USE_S3=false fallback; localhost
  // covers local dev against the Django backend on :8000.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.gazecontrol.in" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
    ],
  },
};

export default nextConfig;
