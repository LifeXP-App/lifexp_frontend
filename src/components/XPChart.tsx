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
  // Generate dynamic dates based on today
  const generateDates = () => {
    const today = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      dates.push(`${month} ${day}`);
    }
    return dates;
  };

  // Map data with dynamic dates
  const dynamicData = data.map((item, index) => ({
    ...item,
    date: generateDates()[index] || item.date
  }));

  // Custom tooltip component for better dark mode control
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-2 border border-gray-300 dark:border-gray-800 rounded-xl p-3 shadow-lg">
          <p className="text-gray-900 dark:text-gray-200 font-medium mb-1">{label}</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dynamicData}
          margin={{ top: 30, right: 10, bottom: 20, left: 0 }} // ✅ tighter sides
        >
          <CartesianGrid vertical={false} stroke="#dcdcdc" strokeWidth={1} className="dark:stroke-gray-700" />

          <XAxis
            dataKey="date"
            tick={{ fill: "#666", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 0, right: 0 }} // ✅ remove extra spacing
            className="dark:[&_text]:fill-gray-400"
          />

          <YAxis
            tick={{ fill: "#666", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, "auto"]}
            className="dark:[&_text]:fill-gray-400"
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
            className="dark:stroke-opacity-70"
          />

          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(200, 200, 200, 0.2)', strokeWidth: 1 }}
            wrapperClassName="dark:[&_.recharts-tooltip-cursor]:stroke-gray-700 dark:[&_.recharts-tooltip-cursor]:stroke-opacity-30"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}