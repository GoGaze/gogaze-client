import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker deployment — produces .next/standalone
  output: 'standalone',
  // For App Router, body size limits are handled via route segment config
  // See src/app/api/media/route.ts for maxDuration configuration
};

export default nextConfig;
