"use client";

import RadarChart, { RadarDataPoint } from "@/src/components/RadarChart";
import getAccentColors, {
  hexToRgba as hexToRgbaUtil,
} from "@/src/components/UserAccent";
import XPChart from "@/src/components/XPChart";
import PrivateProfileNotice from "@/src/components/profile/PrivateProfileNotice";
import { ASPECT_COLORS } from "@/src/lib/constants/aspects";
import {
  mockActivities,
  mockExperiences,
  mockGoals,
  mockProfileStats,
  mockSessions,
  mockWeeklyXP,
} from "@/src/lib/mock/profileData";
import {
  mockOtherUserPrivate,
  mockOtherUserPrivateFollowing,
  mockOtherUserPublic,
  mockUser,
} from "@/src/lib/mock/userData";
import { AspectType, UserProfile } from "@/src/lib/types";
import { FireIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { use, useState } from "react";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Mock function to get user by username
function getUserByUsername(username: string): UserProfile | null {
  const users: Record<string, UserProfile> = {
    patty: mockOtherUserPublic,
    alexs: mockOtherUserPrivate,
    mariag: mockOtherUserPrivateFollowing,
  };
  return users[username.toLowerCase()] || null;
}

export default function OtherProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const profileUser = getUserByUsername(username);
  const currentUser = mockUser; // The logged-in user
  const stats = mockProfileStats;

  const [isFollowing, setIsFollowing] = useState(profileUser?.isFollowing ?? false);

  if (!profileUser) {
    return (
      <main className="w-full flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
        <h1 className="text-2xl font-bold dark:text-white mb-4">User not found</h1>
        <p className="text-gray-500 dark:text-gray-400">@{username} doesn&apos;t exist</p>
      </main>
    );
  }

  // Check if profile content should be visible
  const canViewContent =
    profileUser.visibility === "public" || isFollowing;

  // Calculate radar chart points with comparison data
  const radarData: RadarDataPoint[] = [
    {
      aspect: "Physique",
      value: currentUser.aspects.physique.currentXP,
      comparisonValue: profileUser.aspects.physique.currentXP,
      fullMark: Math.max(
        currentUser.aspects.physique.currentXP,
        profileUser.aspects.physique.currentXP,
        1200
      ),
    },
    {
      aspect: "Energy",
      value: currentUser.aspects.energy.currentXP,
      comparisonValue: profileUser.aspects.energy.currentXP,
      fullMark: Math.max(
        currentUser.aspects.energy.currentXP,
        profileUser.aspects.energy.currentXP,
        1200
      ),
    },
    {
      aspect: "Logic",
      value: currentUser.aspects.logic.currentXP,
      comparisonValue: profileUser.aspects.logic.currentXP,
      fullMark: Math.max(
        currentUser.aspects.logic.currentXP,
        profileUser.aspects.logic.currentXP,
        1200
      ),
    },
    {
      aspect: "Creativity",
      value: currentUser.aspects.creativity.currentXP,
      comparisonValue: profileUser.aspects.creativity.currentXP,
      fullMark: Math.max(
        currentUser.aspects.creativity.currentXP,
        profileUser.aspects.creativity.currentXP,
        1200
      ),
    },
    {
      aspect: "Social",
      value: currentUser.aspects.social.currentXP,
      comparisonValue: profileUser.aspects.social.currentXP,
      fullMark: Math.max(
        currentUser.aspects.social.currentXP,
        profileUser.aspects.social.currentXP,
        1200
      ),
    },
  ];

  // Calculate total XP for the week
  const totalWeeklyXP = mockWeeklyXP.reduce((sum, day) => sum + day.xp, 0);

  const accent = getAccentColors(profileUser.masteryTitle);
  const hexToRgba = hexToRgbaUtil;

  const getAspectColor = (category: AspectType) => {
    return ASPECT_COLORS[category].primary;
  };

  const handleFollow = () => {
    setIsFollowing(true);
  };

  const handleUnfollow = () => {
    setIsFollowing(false);
  };

  return (
    <main className="w-full flex flex-col md:flex-row overflow-y-auto" style={{ minHeight: "calc(100vh - 60px)" }}>
      <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
        {/* PROFILE HEADER */}
        <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4">
          <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
            <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
              <div className="shrink-0">
                {profileUser.avatar ? (
                  <Image
                    src={profileUser.avatar}
                    width={96}
                    height={96}
                    alt={profileUser.username}
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
                      {profileUser.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col w-full">
                <span className="flex items-center gap-2 mb-1">
                  <p className="text-base font-bold dark:text-white">{profileUser.fullname}</p>
                  <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                    @{profileUser.username}
                  </p>
                  {profileUser.visibility === "private" && (
                    <LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </span>
                <span className="flex items-center cursor-pointer">
                  <p
                    className="text-sm font-bold"
                    style={{ color: accent.text }}
                  >
                    {profileUser.masteryTitle}
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

            {canViewContent && (
              <>
                <p className="text-gray-800 dark:text-gray-300 font-semibold">
                  {stats.bio}
                </p>

                <p className="text-gray-500 dark:text-gray-400">{stats.tagline}</p>
                {/* Ongoing Goals */}
                <div className="mt-2">
                  <h3 className="font-bold text-sm mb-3 dark:text-white">Ongoing Goals</h3>
                  <div className="flex gap-2 flex-wrap">
                    {mockGoals.map((goal) => (
                      <span
                        key={goal.id}
                        className="px-3 py-1.5 rounded-full text-xs font-medium flex gap-2 items-center"
                        style={{
                          backgroundColor: hexToRgba(
                            getAspectColor(goal.category),
                            0.15
                          ),
                          border: `1px solid ${getAspectColor(goal.category)}`,
                          color: getAspectColor(goal.category),
                        }}
                      >
                        <p className="text-md">{goal.emoji}</p>
                        {goal.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
              {isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  className="w-full sm:w-auto p-2 rounded-lg cursor-pointer px-12 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-3"
                >
                  Following
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className="w-full sm:w-auto p-2 rounded-lg cursor-pointer px-12 text-white"
                  style={{ backgroundColor: accent.primary }}
                >
                  Follow
                </button>
              )}
              <button className="bg-black/70 hover:bg-black text-white px-8 py-2 rounded-md w-full sm:w-48 dark:hover:bg-gray-100 dark:bg-white dark:text-black">
                Message
              </button>
            </span>
          </div>

          {/* Desktop Chart - Comparison Mode */}
          {canViewContent && (
            <div className="hidden xl:flex w-full focus:outline-none justify-end p-4 sm:p-6 overflow-visible">
              <div className="w-full max-w-[360px] h-[320px] overflow-visible py-6">
                <RadarChart
                  data={radarData}
                  masteryTitle={profileUser.masteryTitle}
                  username={profileUser.username}
                  comparisonMode={true}
                  comparisonUsername={profileUser.username}
                />
              </div>
            </div>
          )}
        </div>

        {/* Private Profile Notice */}
        {!canViewContent && (
          <PrivateProfileNotice username={profileUser.username} />
        )}

        {/* Profile Content - Only visible for public profiles or if following */}
        {canViewContent && (
          <>
            {/* Mobile Chart - Comparison Mode */}
            <div className="xl:hidden my-4 flex justify-center w-full">
              <div className="w-full bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-gray-900 p-6">
                <div className="mx-auto w-full max-w-[280px] h-72">
                  <RadarChart
                    data={radarData}
                    masteryTitle={profileUser.masteryTitle}
                    username={profileUser.username}
                    comparisonMode={true}
                    comparisonUsername={profileUser.username}
                  />
                </div>
              </div>
            </div>

            {/* STREAK, LIFE LEVEL, XP CARDS */}
            <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4">
              {/* Streak count */}
              <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full flex flex-col rounded-md items-center justify-between p-4">
                <p className="text-sm dark:text-gray-300">Streak Count</p>
                <div className="flex gap-2 items-center">
                  <FireIcon className="size-6 text-gray-400 dark:text-gray-500" fill="#BBBBBB" />
                  <p className="text-lg font-bold text-gray-400 dark:text-gray-600">
                    {stats.streakCount}
                  </p>
                </div>
              </div>

              {/* life level */}
              <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full flex flex-col rounded-md items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p className="text-gray-600 dark:text-white text-base sm:text-lg font-bold">
                    Life Level {profileUser.lifeLevel}
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <p style={{ fontSize: "11px" }} className="text-gray-500 dark:text-gray-400">
                    Member since {stats.memberSince}
                  </p>
                </span>
              </div>

              {/* XP */}
              <div className="bg-gray-200 dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full flex flex-col rounded-md items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p
                    style={{ color: accent.text }}
                    className="text-lg font-bold"
                  >
                    {profileUser.totalXP.toLocaleString()} XP
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#AAA"
                    className="h-4 w-4 dark:fill-gray-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p style={{ fontSize: "11px" }} className="text-gray-400 dark:text-gray-500">
                    Mastery unlocks at {stats.xpToMastery.toLocaleString()}
                  </p>
                </span>
              </div>
            </div>

            {/* WEEKLY XP CHART */}
            <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-gray-900 border-2 border-gray-200 rounded-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <span className="flex gap-3 items-center">
                  {profileUser.avatar ? (
                    <Image
                      src={profileUser.avatar}
                      width={32}
                      height={32}
                      alt={profileUser.username}
                      className="h-8 w-8 aspect-square rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${accent.gradStart}, ${accent.gradEnd})`,
                      }}
                    >
                      <span className="text-white text-sm font-bold">
                        {profileUser.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h2 className="opacity-50 dark:opacity-70 text-lg sm:text-xl font-regular dark:text-gray-300">
                    {totalWeeklyXP.toLocaleString()} XP this week
                  </h2>
                </span>
              </div>

              <div className="relative h-48 sm:h-64">
                <XPChart
                  data={mockWeeklyXP}
                  username={profileUser.username}
                  totalXP={totalWeeklyXP}
                  accentColor={accent.primary}
                  gradientStart={accent.gradStart}
                  gradientEnd={accent.gradEnd}
                />
              </div>
            </div>

            {/* TOP ACTIVITIES & RECENT SESSIONS */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold dark:text-white">Top Activities</h2>
                  <span className="text-gray-500 dark:text-gray-400 text-sm"></span>
                </div>

                {mockActivities.map((activity, index) => (
                  <div key={activity.id} className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="text-gray-400 dark:text-gray-500 font-semibold w-5">
                          {index + 1}
                        </span>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <p className="text-2xl">{activity.icon}</p>
                          <span className="font-medium text-sm sm:text-base truncate dark:text-gray-200">
                            {activity.name}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-sm sm:text-md dark:text-gray-300">
                        {activity.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Sessions */}
              <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold dark:text-white">Recent Sessions</h2>
                  <span className="text-gray-500 dark:text-gray-400 text-sm"></span>
                </div>

                {mockSessions.map((session) => (
                  <div key={session.id} className="p-3 hover:bg-gray-100 dark:hover:bg-dark-3 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <p className="text-2xl">{session.icon}</p>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm sm:text-base truncate dark:text-gray-200">
                              {session.activity}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {session.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                        {session.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPERIENCES */}
            <div className="max-w-6xl mx-auto px-2 p-2 pb-12 my-4 rounded-sm w-full">
              <div className="grid grid-cols-3 gap-2 lg:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold col-span-3 dark:text-white">
                  Experiences
                </h2>
                {mockExperiences.map((exp) => (
                  <a
                    key={exp.id}
                    href="#"
                    className="aspect-square overflow-hidden"
                  >
                    <img
                      className="object-cover w-full h-full border-2 border-gray-200 dark:border-gray-800 hover:opacity-90 transition"
                      src={exp.image}
                      alt={exp.title}
                    />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
