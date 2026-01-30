import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable static generation where possible
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [],
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Experimental features for better ISR support
  experimental: {
    // Enable incremental cache handling
    incrementalCacheHandlerPath: undefined,
  },

  // Runtime configuration
  env: {
    PLANNING_DIR: process.env.PLANNING_DIR,
  },
};

export default nextConfig;
