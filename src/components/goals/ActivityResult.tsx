import React from "react";
import { CheckBadgeIcon, PlayIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";

const VERIFIED_TITLE =
  "Verified Activities have reliable XP distributions reviewed and approved by the developers and the community";

const GRID_CARD_NAME_MAX_CHARS = 12;
const GRID_CARD_NAME_TRUNCATE_AT = 9;

function truncateGridCardName(name: string): string {
  return name.length > GRID_CARD_NAME_MAX_CHARS
    ? `${name.slice(0, GRID_CARD_NAME_TRUNCATE_AT)}...`
    : name;
}

interface Activity {
  id: string;
  uid?: string;
  name: string;
  type: ActivityType;
  emoji?: string;
  total_xp?: number;
  verified?: boolean;
}

interface ActivitySelectButtonProps {
  activity: Activity;
  onSelect: (activity: Activity) => void;
  isSelected?: boolean;
}

function ActivitySelectButton({
  activity,
  onSelect,
  isSelected = false,
}: ActivitySelectButtonProps) {
  const meta = ACTIVITY_META[activity.type];

  return (


     <button
                  key={activity.id}
                   onClick={() => onSelect(activity)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                  style={{
                    backgroundColor: `rgba(${meta.cssColorVarRgb}, ${isSelected ? 0.15 : 0.08})`,
                    border: isSelected
                      ? `1px solid rgba(${meta.cssColorVarRgb}, 0.4)`
                      : `1px solid rgba(${meta.cssColorVarRgb}, 0.1)`,
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
                        className="text-sm font-bold tracking-tight flex items-center gap-1"
                        style={{ color: meta.cssColorVar }}
                      >
                        {activity.name}
                        {activity.verified && (
                          <CheckBadgeIcon
                            className="w-4 h-4 shrink-0"
                            style={{ color: meta.cssColorVar }}
                            title={VERIFIED_TITLE}
                          />
                        )}
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

export default React.memo(ActivitySelectButton);

interface ActivityGridCardProps {
  activity: Activity;
  onSelect: (activity: Activity) => void;
  isSelected?: boolean;
}

// Compact card for the maximized picker's 6-column grid: white/dark surface
// card with a big emoji, the activity name, and an XP/hr pill tinted by the
// activity's aspect — a different visual language from ActivitySelectButton's
// full-width tinted row.
function ActivityGridCard({
  activity,
  onSelect,
  isSelected = false,
}: ActivityGridCardProps) {
  const meta = ACTIVITY_META[activity.type];

  return (
    <button
      onClick={() => onSelect(activity)}
      title={activity.name}
      className={`flex flex-col items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98] border ${
        isSelected
          ? "border"
          : "bg-white dark:bg-dark-2 border-gray-200 dark:border-[var(--border)]"
      }`}
      style={
        isSelected
          ? {
              backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.1)`,
              borderColor: `rgba(${meta.cssColorVarRgb}, 0.3)`,
            }
          : undefined
      }
    >
      {typeof activity.total_xp === "number" && (
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500/80"
          // style={{
          //   backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.15)`,
          //   color: meta.cssColorVar,
          // }}
        >
          {activity.total_xp} XP/hr
        </span>
      )}
      <span className="text-4xl">{activity.emoji || meta.icon}</span>

      <span style={{ color: meta.cssColorVar }} className="text-[14px] font-bold tracking-tight text-center whitespace-nowrap text-foreground dark:text-[var(--foreground)] flex items-center gap-1">
        {truncateGridCardName(activity.name)}
        {activity.verified && (
          <CheckBadgeIcon
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: meta.cssColorVar }}
            title={VERIFIED_TITLE}
          />
        )}
      </span>

      
    </button>
  );
}

export { ActivityGridCard };

interface AiSuggestionButtonProps {
  query: string;
  onSelect: () => void;
}

const capitalizeQuery = (query: string) =>
  query
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export function AiSuggestionButton({
  query,
  onSelect,
}: AiSuggestionButtonProps) {
  return (
    <>
      <button
        onClick={onSelect}
        className="ai-suggestion-shine w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98] bg-blue-600/10 border border-blue-500/25"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-blue-200/30 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-inner bg-blue-500/15">
            <SparklesIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold tracking-tight text-blue-700 dark:text-blue-300">
              {capitalizeQuery(query)}
            </span>
            <span className="text-[10px] font-semibold opacity-70 uppercase tracking-widest mt-0.5 text-blue-700 dark:text-blue-300">
              AI GENERATED
            </span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/25">
          <PlayIcon className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </button>

      <style jsx>{`
        .ai-suggestion-shine {
          isolation: isolate;
        }

        .ai-suggestion-shine::before {
          content: "";
          position: absolute;
          inset: -40% auto -40% -45%;
          width: 34%;
          transform: skewX(-18deg) translateX(-160%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.42),
            rgba(191, 219, 254, 0.5),
            transparent
          );
          pointer-events: none;
          animation: aiSuggestionShine 7s ease-in-out infinite;
        }

        @keyframes aiSuggestionShine {
          0%,
          52% {
            transform: skewX(-18deg) translateX(-160%);
            opacity: 0;
          }
          58% {
            opacity: 1;
          }
          92% {
            transform: skewX(-18deg) translateX(520%);
            opacity: 1;
          }
          100% {
            transform: skewX(-18deg) translateX(520%);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
