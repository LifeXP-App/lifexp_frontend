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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"
      fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M96 112c0-26.5 21.5-48 48-48s48 21.5 48 48l0 112 256 0 0-112c0-26.5 21.5-48 48-48s48 21.5 48 48l0 16 16 0c26.5 0 48 21.5 48 48l0 48c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 48c0 26.5-21.5 48-48 48l-16 0 0 16c0 26.5-21.5 48-48 48s-48-21.5-48-48l0-112-256 0 0 112c0 26.5-21.5 48-48 48s-48-21.5-48-48l0-16-16 0c-26.5 0-48-21.5-48-48l0-48c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-48c0-26.5 21.5-48 48-48l16 0 0-16z"/>
      </svg>

    ),
    protagonist: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 448 512"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M338.8-9.9c11.9 8.6 16.3 24.2 10.9 37.8L271.3 224 416 224c13.5 0 25.5 8.4 30.1 21.1s.7 26.9-9.6 35.5l-288 240c-11.3 9.4-27.4 9.9-39.3 1.3s-16.3-24.2-10.9-37.8L176.7 288 32 288c-13.5 0-25.5-8.4-30.1-21.1s-.7-26.9 9.6-35.5l288-240c11.3-9.4 27.4-9.9 39.3-1.3z"/>
      </svg>
   
    ),
    prodigy: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor"
        className={className}
        style={style}><path d="M246.9 18.3L271 3.8c21.6-13 46.3-19.8 71.5-19.8 36.8 0 72.2 14.6 98.2 40.7l63.9 63.9c15 15 23.4 35.4 23.4 56.6l0 30.9 19.7 19.7 0 0c15.6-15.6 40.9-15.6 56.6 0s15.6 40.9 0 56.6l-64 64c-15.6 15.6-40.9 15.6-56.6 0s-15.6-40.9 0-56.6L464 240 433.1 240c-21.2 0-41.6-8.4-56.6-23.4l-49.1-49.1c-15-15-23.4-35.4-23.4-56.6l0-12.7c0-11.2-5.9-21.7-15.5-27.4l-41.6-25c-10.4-6.2-10.4-21.2 0-27.4zM50.7 402.7l222.1-222.1 90.5 90.5-222.1 222.1c-25 25-65.5 25-90.5 0s-25-65.5 0-90.5z"/></svg>

    ),
    alchemist: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"
        className={className}
        style={style}><path d="M120 56c0-30.9 25.1-56 56-56l24 0c17.7 0 32 14.3 32 32l0 448c0 17.7-14.3 32-32 32l-32 0c-29.8 0-54.9-20.4-62-48-.7 0-1.3 0-2 0-44.2 0-80-35.8-80-80 0-18 6-34.6 16-48-19.4-14.6-32-37.8-32-64 0-30.9 17.6-57.8 43.2-71.1-7.1-12-11.2-26-11.2-40.9 0-44.2 35.8-80 80-80l0-24zm272 0l0 24c44.2 0 80 35.8 80 80 0 15-4.1 29-11.2 40.9 25.7 13.3 43.2 40.1 43.2 71.1 0 26.2-12.6 49.4-32 64 10 13.4 16 30 16 48 0 44.2-35.8 80-80 80-.7 0-1.3 0-2 0-7.1 27.6-32.2 48-62 48l-32 0c-17.7 0-32-14.3-32-32l0-448c0-17.7 14.3-32 32-32l24 0c30.9 0 56 25.1 56 56z"/></svg>
    
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
    )
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
    <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
      <h4 className="font-semibold text-lg mb-4 dark:text-white">Other Leaderboards</h4>
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
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  className="w-5 h-5"
                  style={{ color: "#64748b" }}
                >
                 <path d="M351.9 280l-190.9 0c2.9 64.5 17.2 123.9 37.5 167.4 11.4 24.5 23.7 41.8 35.1 52.4 11.2 10.5 18.9 12.2 22.9 12.2s11.7-1.7 22.9-12.2c11.4-10.6 23.7-28 35.1-52.4 20.3-43.5 34.6-102.9 37.5-167.4zM160.9 232l190.9 0C349 167.5 334.7 108.1 314.4 64.6 303 40.2 290.7 22.8 279.3 12.2 268.1 1.7 260.4 0 256.4 0s-11.7 1.7-22.9 12.2c-11.4 10.6-23.7 28-35.1 52.4-20.3 43.5-34.6 102.9-37.5 167.4zm-48 0C116.4 146.4 138.5 66.9 170.8 14.7 78.7 47.3 10.9 131.2 1.5 232l111.4 0zM1.5 280c9.4 100.8 77.2 184.7 169.3 217.3-32.3-52.2-54.4-131.7-57.9-217.3L1.5 280zm398.4 0c-3.5 85.6-25.6 165.1-57.9 217.3 92.1-32.7 159.9-116.5 169.3-217.3l-111.4 0zm111.4-48C501.9 131.2 434.1 47.3 342 14.7 374.3 66.9 396.4 146.4 399.9 232l111.4 0z"/></svg>
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
