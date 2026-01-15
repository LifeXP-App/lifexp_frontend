"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface XPChartProps {
  data: {
    date: string;
    xp: number;
  }[];
  username: string;
  totalXP: number;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
}

export default function XPChart({
  data,
  username,
  totalXP,
  accentColor,
}: XPChartProps) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 30, right: 10, bottom: 20, left: 0 }} // ✅ tighter sides
        >
          <CartesianGrid vertical={false} stroke="#dcdcdc" strokeWidth={1} />

          <XAxis
            dataKey="date"
            tick={{ fill: "#666", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 0, right: 0 }} // ✅ remove extra spacing
          />

          <YAxis
            tick={{ fill: "#666", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, "auto"]}
          />

         

          <Line
            type="monotone"
            dataKey="xp"
            name={username}
            stroke={accentColor}
            strokeOpacity={0.5}
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: accentColor,
              stroke: accentColor,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 4,
              fill: accentColor,
              stroke: accentColor,
              strokeWidth: 2,
            }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "2px solid #ddd",
              fontSize: "12px",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
