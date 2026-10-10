"use client";

export type StrengthTier = "dormant" | "light" | "steady" | "strong";

interface StrengthInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  // Color of the filled bars (the habit's aspect color, or cyan if frozen).
  accentColor: string;
  currentTier?: StrengthTier;
}

const BARS = [
  { height: 16, y: 39 },
  { height: 30, y: 25 },
  { height: 45, y: 10 },
];

// Same dark card in light and dark mode, like the Mastery Titles popup.
export default function StrengthInfoPopup({
  isOpen,
  onClose,
  accentColor,
  currentTier,
}: StrengthInfoPopupProps) {
  if (!isOpen) return null;

  const tiers: { tier: StrengthTier; label: string; filled: number; text: string }[] = [
    {
      tier: "dormant",
      label: "Dormant",
      filled: 0,
      text: "This is when you quit your habit for a long long time.",
    },
    {
      tier: "light",
      label: "Weak",
      filled: 1,
      text: "This is when you do the activity for the first time after being dormant.",
    },
    {
      tier: "steady",
      label: "Steady",
      filled: 2,
      text: "This is when you show up every week for 2 weeks in a row after being weak.",
    },
    {
      tier: "strong",
      label: "Strong",
      filled: 3,
      text: "Stay steady and show up every week for 2 more weeks to become strong.",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        style={{ width: "90%", maxWidth: "820px" }}
        className="bg-dark-1 border border-gray-200 dark:border-[var(--border)] rounded-2xl shadow-xl px-8 pt-8 pb-5 text-center space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-200">Habit Strength</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tiers.map(({ tier, label, filled, text }) => {
            const isCurrent = tier === currentTier;
            return (
              <div
                key={tier}
                className={`flex flex-col items-center rounded-2xl px-3 py-4 transition ${
                  isCurrent ? "bg-white/5" : ""
                }`}
                style={{ opacity: currentTier && !isCurrent ? 0.7 : 1 }}
              >
                <svg width={96} height={93} viewBox="0 0 48 62" role="img" aria-label={label}>
                  {BARS.map((bar, index) => (
                    <rect
                      key={index}
                      x={3 + index * 16}
                      y={bar.y}
                      width="10"
                      height={bar.height}
                      rx="2.5"
                      fill={index < filled ? accentColor : "transparent"}
                      stroke="#6b7280"
                      strokeOpacity={index < filled ? 0 : 0.6}
                      strokeWidth={index < filled ? 0 : 1.5}
                    />
                  ))}
                </svg>
                <h3 className="mt-3 text-white font-semibold text-lg">{label}</h3>
                <p className="mt-1 text-sm text-gray-400">{text}</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-2 bg-white text-black cursor-pointer rounded-xl hover:bg-gray-100 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
