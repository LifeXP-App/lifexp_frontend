"use client";

import { MASTERY_COLORS } from "@/src/lib/constants/aspects";
import { MasteryTitle } from "@/src/lib/types";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  data: {
    aspect: string;
    value: number;
    fullMark: number;
  }[];
  masteryTitle: MasteryTitle;
  username: string;
}

export default function RadarChart({
  data,
  masteryTitle,
  username,
}: RadarChartProps) {
  const masteryColor = MASTERY_COLORS[masteryTitle].primary;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data}>
          <PolarGrid
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-700"
          />
          <PolarAngleAxis
            dataKey="aspect"
            tick={{
              fill: "currentColor",
              fontSize: 12,
            }}
            className="text-gray-700 dark:text-gray-400"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 12]}
            tick={{
              fill: "currentColor",
              fontSize: 10,
            }}
            className="text-gray-500 dark:text-gray-600"
          />
          <Radar
            name={username}
            dataKey="value"
            stroke={masteryColor}
            fill={masteryColor}
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
