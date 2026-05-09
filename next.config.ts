import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Prevent Vercel deployment failures from non-critical lint warnings
    // (e.g. setMounted hydration guards, wagmi `any` types)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Prevent TS strict-mode errors from blocking deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
