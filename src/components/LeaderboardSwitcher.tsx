import { MASTERY_TYPES } from "@/src/lib/mock/goalLeaderboardData";
import Link from "next/link";

// Mastery icon SVGs
function MasteryIcon({
  type,
  className,
  style,
}: {
  type: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const icons: Record<string, React.ReactNode> = {
    warrior: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M7.05 3.5L4 6.5v4.5l-2.5 2.5 2 2 2.5-2.5h4.5l3-3.05L12 8.45l-1.5 1.5-1.95-1.95 1.5-1.5-1.5-1.5-1.5 1.5-1.95-1.95 1.5-1.5L5.1 3.5h1.95M19 3l-6.5 6.5 2 2L21 5v-.5L19.5 3H19M3 19l2 2 7-7-2-2-7 7z" />
      </svg>
    ),
    protagonist: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M12 7a5 5 0 1 1-4.995 5.217L7 12l.005-.217A5 5 0 0 1 12 7zm0 2a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9zm0-7l2.5 3h-5L12 2zm0 18l-2.5-3h5L12 22zM2 12l3-2.5v5L2 12zm20 0l-3 2.5v-5L22 12z" />
      </svg>
    ),
    prodigy: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M12 3c.5 0 1 .19 1.41.59l2 2c.4.4.59.9.59 1.41v1h3c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9c0-1.1.9-2 2-2h3V7c0-.5.19-1 .59-1.41l2-2c.4-.4.9-.59 1.41-.59zm0 2l-2 2v1h4V7l-2-2zm-4 6v2h3v-2H8zm5 0v2h3v-2h-3zm-5 4v2h3v-2H8zm5 0v2h3v-2h-3z" />
      </svg>
    ),
    alchemist: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M5 19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-.21-.07-.41-.18-.57L13 8.35V4h-2v4.35L5.18 18.43c-.11.16-.18.36-.18.57zm1-16h12v2H6V3zm2.1 14h7.8L12 10.85 8.1 17z" />
      </svg>
    ),
    diplomat: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9 3.5 3.5 0 0 1 12 5.5M5 8c.56 0 1.08.15 1.53.42-.15 1.43.27 2.85 1.13 3.96C7.16 13.34 6.16 14 5 14a3 3 0 0 1-3-3 3 3 0 0 1 3-3m14 0a3 3 0 0 1 3 3 3 3 0 0 1-3 3c-1.16 0-2.16-.66-2.66-1.62a5.54 5.54 0 0 0 1.13-3.96c.45-.27.97-.42 1.53-.42M5.5 18.25c0-2.07 2.91-3.75 6.5-3.75s6.5 1.68 6.5 3.75V20h-13v-1.75M0 20v-1.5c0-1.39 1.89-2.56 4.45-2.9-.59.68-.95 1.62-.95 2.65V20H0m24 0h-3.5v-1.75c0-1.03-.36-1.97-.95-2.65 2.56.34 4.45 1.51 4.45 2.9V20z" />
      </svg>
    ),
  };

  return <>{icons[type] || null}</>;
}

interface LeaderboardSwitcherProps {
  currentLeaderboard?: string; // e.g., "warrior", "rookie", etc.
}

export default function LeaderboardSwitcher({
  currentLeaderboard,
}: LeaderboardSwitcherProps) {
  return (
    <div className="bg-white dark:bg-dark-2 p-5 rounded-2xl shadow-sm">
      <h4 className="font-semibold mb-4 dark:text-white">Other Leaderboards</h4>
      <div className="space-y-2">
        {/* Mastery Leaderboards */}
        {MASTERY_TYPES.filter((m) => m.id !== currentLeaderboard).map(
          (mastery) => (
            <Link key={mastery.id} href={`/leaderboard/goals/${mastery.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-3 cursor-pointer transition-all group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                  style={{ backgroundColor: `${mastery.color}15` }}
                >
                  <MasteryIcon
                    type={mastery.id}
                    className="w-5 h-5"
                    style={{ color: mastery.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {mastery.name}
                  </p>
                  <p className="text-xs text-gray-500">{mastery.aspect}</p>
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: mastery.color }}
                >
                  {mastery.playerCount}
                </span>
              </div>
            </Link>
          )
        )}

        {/* Rookie Leaderboard */}
        {currentLeaderboard !== "rookie" && (
          <Link href="/leaderboard/rookie">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-3 cursor-pointer transition-all group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                style={{ backgroundColor: "#64748b15" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  style={{ color: "#64748b" }}
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Rookie
                </p>
                <p className="text-xs text-gray-500">All Aspects</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
