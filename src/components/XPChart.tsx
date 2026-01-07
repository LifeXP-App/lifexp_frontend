"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

export default function XPChart({ data, username, totalXP, accentColor, gradientStart, gradientEnd }: XPChartProps) {
  return (
    <div className="bg-white dark:bg-dark-2 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-900">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          }}
        >
          <span className="text-white text-xl font-bold">
            {username[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold">{totalXP} XP this week</h2>
        </div>
      </div>

      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-800"
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: "currentColor",
                fontSize: 12,
              }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{
                fill: "currentColor",
                fontSize: 12,
              }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)",
              }}
            />
            <ReferenceLine
              y={0}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-700"
            />
            <Line
              type="monotone"
              dataKey="xp"
              stroke={accentColor}
              strokeWidth={2}
              dot={{ fill: accentColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
