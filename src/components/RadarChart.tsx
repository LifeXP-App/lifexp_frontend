"use client";

import { useMemo, type ComponentProps } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarDataPoint {
  aspect: string;
  value: number;
  fullMark: number;
  comparisonValue?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  masteryTitle: string;
  username: string;
  comparisonMode?: boolean;
  comparisonUsername?: string;
  color?: string;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  dataKey: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-dark-2 border border-gray-200 dark:border-[var(--border)] rounded-lg shadow-lg px-3 py-2">
      <p className="font-semibold text-sm text-gray-800 dark:text-[var(--foreground)] mb-1">
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function RadarChart({
  data,
  username,
  comparisonMode = false,
  comparisonUsername,
  color = "#4f7df3",
}: RadarChartProps) {
  // Radius domain based on fullMark, rounded up to a multiple of the tick
  // step count so the 5 rings (0..max) land on evenly-spaced whole numbers.
  // Without this, an arbitrary max (e.g. 10) produces uneven ticks like
  // 0, 3, 6, 9, 10 — the last ring bunched up right next to the previous one.
  const RADIAL_TICK_STEPS = 4;

  const maxMark = useMemo(() => {
    const values = data.flatMap((d) => [
      d.value,
      d.comparisonValue ?? 0,
      d.fullMark ?? 0,
    ]);
    const rawMax = Math.max(...values, 10);
    return Math.ceil(rawMax / RADIAL_TICK_STEPS) * RADIAL_TICK_STEPS;
  }, [data]);

  // Recharts' typings for `ticks` expect internally-computed TickItem objects,
  // but at runtime it accepts (and maps through the scale) plain numbers —
  // passing them explicitly guarantees exactly RADIAL_TICK_STEPS even
  // divisions instead of trusting the "nice tick" heuristic to land evenly.
  const radialTicks = useMemo(
    () =>
      Array.from({ length: RADIAL_TICK_STEPS + 1 }, (_, i) =>
        Math.round((i * maxMark) / RADIAL_TICK_STEPS),
      ) as unknown as ComponentProps<typeof PolarRadiusAxis>["ticks"],
    [maxMark],
  );



  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          data={data}
          outerRadius="70%"
          margin={{ top: 0, right: 10, bottom: 0, left: 20 }}
        >
          <PolarGrid
            stroke="#cfcfcf"
            strokeWidth={1}
            gridType="polygon"
            className="dark:stroke-gray-700"
          />

          <PolarAngleAxis
            dataKey="aspect"
            tickLine={false}
            axisLine={false}
            tickSize={18}
            tick={{
              fill: "#333",
              fontSize: 14,
              fontWeight: 500,
            }}
            className="dark:[&_text]:fill-gray-400"
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, maxMark]}
            ticks={radialTicks}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#555",
              fontSize: 12,
              fontWeight: 500,
            }}
            className="dark:[&_text]:fill-gray-200"
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Primary user radar (You) */}
          <Radar
            name={"You"}
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.25}
            dot={{
              r: 3,
              fill: color,
              stroke: "#ffffff",
              strokeWidth: 1.5,
            }}
            className="dark:[&_circle]:stroke-gray-900"
          />

          {/* Comparison user radar (shown when viewing others' profile) */}
          {comparisonMode && (
            <Radar
              name={comparisonUsername || "Them"}
              dataKey="comparisonValue"
              stroke="#888888"
              strokeWidth={2}
              fill="rgba(136, 136, 136, 0.15)"
              dot={{
                r: 3,
                fill: "#888888",
                stroke: "#ffffff",
                strokeWidth: 1.5,
              }}
              className="dark:[&_circle]:stroke-gray-900"
            />
          )}

          {/* Legend for comparison mode */}
          {comparisonMode && (
            <Legend
              wrapperStyle={{
                paddingTop: 10,
              }}
              formatter={(value) => (
                <span className="text-sm text-gray-700 dark:text-[var(--muted)]">
                  {value}
                </span>
              )}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}