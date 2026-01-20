import React from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

interface ActivitySelectButtonProps {
  activity: Activity;
  onSelect: (activity: Activity) => void;
}

export default function ActivitySelectButton({
  activity,
  onSelect,
}: ActivitySelectButtonProps) {
  const meta = ACTIVITY_META[activity.type];

  return (
    <button
      onClick={() => onSelect(activity)}
      className="w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group"
      style={{
        backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.2)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div style={{ color: meta.cssColorVar }}>{meta.icon}</div>

        <span
          className="text-base font-semibold"
          style={{ color: meta.cssColorVar }}
        >
          {activity.name}
        </span>
      </div>

      <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
        <PlayIcon className="w-4 h-4 text-gray-800" />
      </div>
    </button>
  );
}