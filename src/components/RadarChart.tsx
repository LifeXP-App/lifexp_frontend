"use client";

import { useMemo } from "react";
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
  masteryTitle: string;
  username: string;
}

export default function RadarChart({ data }: RadarChartProps) {
  // Match screenshot blue
  const strokeColor = "#4f7df3";
  const fillColor = "rgba(79, 125, 243, 0.25)";

  // Radius domain based on fullMark (image shows 0-400)
  const maxMark = useMemo(() => {
    return Math.max(...data.map((d) => d.fullMark ?? 0), 10);
  }, [data]);

  return (
    <div className="w-full h-full bg-gray-100">
      <ResponsiveContainer width="100%" height="100%">
       <RechartsRadarChart
    data={data}
    outerRadius="70%"
    margin={{ top: 0, right: 10, bottom: 0, left: 20 }}
  >
    <PolarGrid stroke="#cfcfcf" strokeWidth={1} gridType="polygon" />

    <PolarAngleAxis
      dataKey="aspect"
      tickLine={false}
      axisLine={false}
      tickSize={18}
      tick={{
        fill: "#333",
        fontSize: 12,
        fontWeight: 500,
      }}
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
    />

    <Radar
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

    />
  </RechartsRadarChart>

      </ResponsiveContainer>
    </div>
  );
}
