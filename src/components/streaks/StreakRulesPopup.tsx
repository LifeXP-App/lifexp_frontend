"use client";

import { Award, Flame, Palmtree, RotateCcw, Snowflake } from "lucide-react";
import { FLAME_COLORS, FREEZE_COLOR } from "@/src/components/streaks/flames";

interface StreakRulesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  freezeEarningDays: number;
  freezeCap: number;
}

// Same dark card in light and dark mode, like the Habit Strength popup.
export default function StreakRulesPopup({ isOpen, onClose, freezeEarningDays, freezeCap }: StreakRulesPopupProps) {
  if (!isOpen) return null;

  const rules = [
    {
      icon: <Flame className="h-5 w-5 fill-current" />,
      color: FLAME_COLORS.Kindled,
      title: "Flames",
      text: "Reach 7, 30 and 100 streak days to evolve from Spark to Kindled, Blaze and Inferno. Unlocked flames stay yours after a break.",
    },
    {
      icon: <Award className="h-5 w-5" />,
      color: "#f59e0b",
      title: "Comebacks",
      text: "After a streak breaks, complete sessions on three separate days to earn a comeback badge. Another break restarts the quest. Vacation and restorations don’t count.",
    },
    {
      icon: <Snowflake className="h-5 w-5" />,
      color: FREEZE_COLOR,
      title: "Freezes",
      text: `Complete sessions on ${freezeEarningDays} activity days to earn a freeze, up to ${freezeCap}. Each freeze covers one missed day automatically but doesn’t add to your streak.`,
    },
    {
      icon: <Palmtree className="h-5 w-5" />,
      color: "#10b981",
      title: "Vacation",
      text: "Pauses your streak until you return. No freezes are spent, and streak growth and freeze earning pause too.",
    },
    {
      icon: <RotateCcw className="h-5 w-5" />,
      color: "#a78bfa",
      title: "Restore tokens",
      text: "A token brings back your latest broken streak (not your personal best) and keeps your current progress. Tokens are separate from freezes.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50 animate-backdrop-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-rules-title"
        style={{ width: "90%", maxWidth: "560px" }}
        className="max-h-[85vh] cursor-auto overflow-y-auto noscrollbar rounded-2xl border border-gray-200 bg-dark-1 px-6 pb-5 pt-6 shadow-xl animate-dialog-in dark:border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="streak-rules-title" className="text-xl font-semibold text-gray-200">How streaks work</h2>
        <p className="mt-1 text-[15px] text-gray-400">Complete at least one session a day to keep your flame alive.</p>
        <ul className="mt-5 space-y-4">
          {rules.map((rule) => (
            <li key={rule.title} className="flex gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ color: rule.color, backgroundColor: `${rule.color}1f` }}
              >
                {rule.icon}
              </span>
              <div>
                <h3 className="font-semibold text-white">{rule.title}</h3>
                <p className="mt-0.5 text-[15px] text-gray-400">{rule.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-white px-8 py-2 text-black transition hover:bg-gray-100"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
