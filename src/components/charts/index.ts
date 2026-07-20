// Plain re-export barrel — no "use client" needed here, this file has no
// runtime code of its own. Importing both charts through this single module
// specifier (instead of each page pointing at RadarChart.tsx/XPChart.tsx
// separately) lets Turbopack resolve every dynamic import() below to the
// same module, so recharts and its dependency graph are emitted once
// instead of once per chart per page.
export { default as RadarChart } from "@/src/components/RadarChart";
export { default as XPChart } from "@/src/components/XPChart";
export type { RadarDataPoint } from "@/src/components/RadarChart";
