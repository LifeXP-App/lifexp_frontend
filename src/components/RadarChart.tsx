"use client";

import { useMemo } from "react";
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
    <div className="bg-white dark:bg-dark-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2">
      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">
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
}: RadarChartProps) {
  // Radius domain based on fullMark
  const maxMark = useMemo(() => {
    const values = data.flatMap((d) => [
      d.value,
      d.comparisonValue ?? 0,
      d.fullMark ?? 0,
    ]);
    return Math.max(...values, 10);
  }, [data]);

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
            tickCount={5}
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
            name={comparisonMode ? "You" : username}
            dataKey="value"
            stroke="#4f7df3"
            strokeWidth={2}
            fill="rgba(79, 125, 243, 0.25)"
            dot={{
              r: 3,
              fill: "#4f7df3",
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
                <span className="text-sm text-gray-700 dark:text-gray-300">
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