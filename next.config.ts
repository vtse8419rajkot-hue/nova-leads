import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Ship the committed demo SQLite db inside serverless bundles so the app
     can bootstrap it to /tmp on Vercel (see src/lib/db.ts). */
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
