"use client";

import { FireIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

/* ---------------- TYPES ---------------- */

export type UserStatusProps = {
  player: {
    username: string;
    fullname: string;
    lifelevel: number;
    streak_count: number;
    profile_picture: string;
    streak_active?: boolean; // optional
    last_activity?: {
      name: string;
      emoji: string;
      type: ActivityType;
    } | null;
  };
};

/* ---------------- COMPONENT ---------------- */

export function UserStatus({ player }: UserStatusProps) {
  const activity = player.last_activity;
  const activityText = activity ? `${activity.emoji} ${activity.name}` : "🌙 Idling";
  const activityColor = activity ? ACTIVITY_META[activity.type].cssColorVar : undefined;

  return (
    <Link href={`/u/${player.username}`}>
      <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] flex p-3 rounded-xl gap-3 min-w-[220px] max-w-[220px] items-center cursor-pointer flex-shrink-0">
        <Image
          src={player.profile_picture}
          width={56}
          height={56}
          alt="User"
          className="border-opacity-50 p-[1.5px] rounded-full h-14 w-14 aspect-square object-cover"
          unoptimized
        />

        <div className="flex flex-col justify-between flex-1 min-w-0">
          <h1 className="text-md font-semibold truncate">{player.fullname}</h1>

          <p className="text-xs font-medium text-black/40 dark:text-[var(--foreground)]/40">
            Life Level {player.lifelevel}
          </p>

          <div className="flex items-center">
            <p
              className="font-semibold text-xs ml-1 truncate"
              style={activityColor ? { color: activityColor } : undefined}
            >
              {activityText} · 
            </p>
             {player.streak_active ? (
              <FireIcon className="w-4 h-4 text-yellow-500 ml-1 flex-shrink-0" />
            ) : (
              <FireIcon className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" />
            )}
            <p className="font-semibold text-xs truncate flex-shrink-0">
              {player.streak_count}
            </p>
           
          </div>
        </div>
      </div>
    </Link>
  );
}
