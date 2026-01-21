"use client";

import getAccentColors from "@/src/components/UserAccent";
import { UserProfile } from "@/src/lib/types";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

interface ProfileHeaderProps {
  user: UserProfile;
  stats: {
    posts: number;
    followers: number;
    following: number;
    bio: string;
    tagline: string;
  };
  isOwnProfile: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

export default function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  onFollow,
  onUnfollow,
}: ProfileHeaderProps) {
  const accent = getAccentColors(user.masteryTitle);

  return (
    <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
      <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
        <div className="shrink-0">
          {user.avatar ? (
            <Image
              src={user.avatar}
              width={96}
              height={96}
              alt={user.username}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center"
              style={{
                backgroundImage: `linear-gradient(135deg, ${accent.gradStart}, ${accent.gradEnd})`,
              }}
            >
              <span className="text-white text-2xl font-bold">
                {user.username[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col w-full">
          <span className="flex items-center gap-2 mb-1">
            <p className="text-base font-bold dark:text-white">{user.fullname}</p>
            <p className="text-base font-medium text-gray-500 dark:text-gray-400">
              @{user.username}
            </p>
            {user.visibility === "private" && (
              <LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </span>
          <span className="flex items-center cursor-pointer">
            <p
              className="text-sm font-bold"
              style={{ color: accent.text }}
            >
              {user.masteryTitle}
            </p>
            <button
              type="button"
              className="mastery-info flex float-right cursor-pointer"
            >
              <svg
                className="w-4 h-4 ms-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">Show Info</span>
            </button>
          </span>
          <div className="mt-4 flex gap-6 sm:gap-8 text-sm">
            <div className="text-center sm:text-left">
              <p className="font-semibold dark:text-white">{stats.posts}</p>
              <p className="text-gray-500 dark:text-gray-400">Posts</p>
            </div>
            <div className="text-center sm:text-left cursor-pointer">
              <p className="font-semibold dark:text-white">{stats.followers}</p>
              <p className="text-gray-500 dark:text-gray-400">Followers</p>
            </div>
            <div className="text-center sm:text-left cursor-pointer">
              <p className="font-semibold dark:text-white">{stats.following}</p>
              <p className="text-gray-500 dark:text-gray-400">Following</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-800 dark:text-gray-300 font-semibold">
        {stats.bio}
      </p>

      <p className="text-gray-500 dark:text-gray-400">{stats.tagline}</p>

      {/* Action buttons */}
      <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
        {isOwnProfile ? (
          <>
            <button
              className="w-full sm:w-auto p-2 rounded-lg cursor-pointer px-12 text-white"
              style={{ backgroundColor: accent.primary }}
            >
              Edit Profile
            </button>
            <button className="bg-black/70 hover:bg-black text-white px-8 py-2 rounded-md w-full sm:w-48 dark:hover:bg-gray-100 dark:bg-white dark:text-black">
              Share Profile
            </button>
          </>
        ) : (
          <>
            {user.isFollowing ? (
              <button
                onClick={onUnfollow}
                className="w-full sm:w-auto p-2 rounded-lg cursor-pointer px-12 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-3"
              >
                Following
              </button>
            ) : (
              <button
                onClick={onFollow}
                className="w-full sm:w-auto p-2 rounded-lg cursor-pointer px-12 text-white"
                style={{ backgroundColor: accent.primary }}
              >
                Follow
              </button>
            )}
            <button className="bg-black/70 hover:bg-black text-white px-8 py-2 rounded-md w-full sm:w-48 dark:hover:bg-gray-100 dark:bg-white dark:text-black">
              Message
            </button>
          </>
        )}
      </span>
    </div>
  );
}
