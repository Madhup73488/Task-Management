import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['sib-api-v3-sdk'], // Add this line to transpile the Brevo SDK
  // Silence Turbopack warning when custom webpack config is present
  turbopack: {
    // Explicitly set the root to the current project directory to resolve workspace root inference issues
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
