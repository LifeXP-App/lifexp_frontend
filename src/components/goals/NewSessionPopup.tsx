"use client";

import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import { PlayIcon } from "@heroicons/react/24/solid";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

interface NewSessionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  onNewActivity: () => void;
  recentActivities?: Activity[];
}

const defaultRecentActivities: Activity[] = [
  { id: "r1", name: "Drawing", type: "creativity" },
  { id: "r2", name: "Deep Work", type: "creativity" },
  { id: "r3", name: "Sketching", type: "creativity" },
];

export default function NewSessionPopup({
  isOpen,
  onClose,
  onSelectActivity,
  onNewActivity,
  recentActivities = defaultRecentActivities,
}: NewSessionPopupProps) {
  if (!isOpen) return null;

  const activitiesToShow = recentActivities.slice(0, 3);

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white/90 dark:bg-dark-2/90 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-white leading-tight">
              Start Session
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 opacity-70">
              Pick up where you left off
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5  transition-all cursor-pointer"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Recent Activities Section */}
        <div className="px-6 pb-6 space-y-3">
          <div className="space-y-2.5">
            {activitiesToShow.map((activity, index) => {
              const meta = ACTIVITY_META[activity.type];
              return (
                <button
                  key={activity.id}
                  onClick={() => onSelectActivity(activity)}
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
            })}
          </div>
        </div>

        {/* New Activity Button */}
        <div className="p-6 pt-2">
          <button
            onClick={onNewActivity}
            className="w-full py-3 rounded-2xl font-medium text-white transition-all cursor-pointer hover:shadow-[0_8px_20px_-8px_rgba(65,104,226,0.6)] active:scale-[0.97] flex items-center justify-center gap-2 group"
            style={{
              background:
                "linear-gradient(135deg, var(--rookie-primary) 0%, #5d81f2 100%)",
            }}
          >
            <span >Start New Activity</span>
          </button>
        </div>
      </div>
    </div>
  );
}
