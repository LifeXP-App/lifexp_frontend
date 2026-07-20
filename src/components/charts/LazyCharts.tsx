"use client";

import dynamic from "next/dynamic";

// Single shared skeleton + single shared dynamic import() target for every
// chart in the app. Both exports resolve the same "@/src/components/charts"
// module specifier, so this whole file (recharts + its dependency graph)
// is emitted as exactly one lazy-loaded chunk, reused by every page that
// renders a chart instead of each page/chart pulling its own copy.
const ChartSkeleton = () => (
  <div className="w-full h-full animate-pulse rounded-xl bg-gray-100 dark:bg-dark-3" />
);

export const RadarChart = dynamic(
  () => import("@/src/components/charts").then((mod) => mod.RadarChart),
  { ssr: false, loading: ChartSkeleton },
);

export const XPChart = dynamic(
  () => import("@/src/components/charts").then((mod) => mod.XPChart),
  { ssr: false, loading: ChartSkeleton },
);
