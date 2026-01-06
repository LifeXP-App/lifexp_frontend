"use client";

import Image from "next/image";
import Link from "next/link";

/* ---------------- TYPES ---------------- */

export type UserStatusProps = {
  player: {
    username: string;
    fullname: string;
    lifelevel: number;
    streak_count: number;
    profile_picture: string;
  };
};

/* ---------------- COMPONENT ---------------- */

export function UserStatus({ player }: UserStatusProps) {
  return (
    <div className="mb-8 pl-2 md:pl-0 flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <Link href={`/user/${player.username}`}>
        <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 flex p-3 rounded-xl gap-3 min-w-[200px] max-w-[250px] items-center cursor-pointer flex-shrink-0">
          <Image
            src={player.profile_picture}
            width={56}
            height={56}
            alt="User"
            className="border-opacity-50 p-[1.5px] rounded-full h-14 w-14 aspect-square object-cover"
            unoptimized
          />

          <div className="flex flex-col justify-between">
            <h1 className="text-md font-semibold">
              {player.fullname}
            </h1>

            <p className="text-xs font-medium text-black/40 dark:text-white/40">
              Life Level {player.lifelevel}
            </p>

            <div className="flex items-center">
              <p className="font-semibold text-xs ml-1">
                {player.streak_count}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
