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
                  key={activity.id}
                   onClick={() => onSelect(activity)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                  style={{
                    backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.08)`,
                    border: `1px solid rgba(${meta.cssColorVarRgb}, 0.1)`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(${meta.cssColorVarRgb}, 0.05), transparent)`,
                    }}
                  />

                  <div className="flex items-center gap-4 relative z-10">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-inner"
                      style={{
                        backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.15)`,
                      }}
                    >
                      <div
                        className="scale-125"
                        style={{ color: meta.cssColorVar }}
                      >
                        {meta.icon}
                      </div>
                    </div>
                    <div className="flex flex-col items-start ">
                      <span
                        className="text-sm font-bold tracking-tight"
                        style={{ color: meta.cssColorVar }}
                      >
                        {activity.name}
                      </span>
                      <span
                        className="text-[10px] font-semibold opacity-60 uppercase tracking-widest mt-0.5"
                        style={{ color: meta.cssColorVar }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/20 dark:bg-black/10 group-hover:bg-white/50 dark:group-hover:bg-black/20 "
                    style={{
                      border: `1px solid rgba(${meta.cssColorVarRgb}, 0.2)`,
                    }}
                  >
                    <PlayIcon
                      className="w-3.5 h-3.5"
                      style={{ color: meta.cssColorVar }}
                    />
                  </div>
                </button>
  );
}