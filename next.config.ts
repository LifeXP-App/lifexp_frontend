import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

// Only wraps the webpack config with the analyzer plugin when ANALYZE=true;
// a no-op otherwise, so normal `next dev`/`next build` runs are unaffected.
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: process.env.ANALYZE === "true",
  experimental: {
    optimizePackageImports: [
      "@heroicons/react",
      "react-icons",
      "lucide-react",
      "recharts",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gamilife.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withBundleAnalyzer(nextConfig);
