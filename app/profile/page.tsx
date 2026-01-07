"use client";

import RadarChart from "@/src/components/RadarChart";
import getAccentColors, {
  hexToRgba as hexToRgbaUtil,
} from "@/src/components/UserAccent";
import XPChart from "@/src/components/XPChart";
import { ASPECT_COLORS } from "@/src/lib/constants/aspects";
import {
  mockActivities,
  mockExperiences,
  mockGoals,
  mockProfileStats,
  mockSessions,
  mockWeeklyXP,
} from "@/src/lib/mock/profileData";
import { mockUser } from "@/src/lib/mock/userData";
import { AspectType } from "@/src/lib/types";
import { Flame } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const user = mockUser;
  const stats = mockProfileStats;

  // Calculate radar chart points for pentagon
  const radarData = [
    { aspect: "Physique", value: user.aspects.physique.level, fullMark: 12 },
    { aspect: "Energy", value: user.aspects.energy.level, fullMark: 12 },
    { aspect: "Logic", value: user.aspects.logic.level, fullMark: 12 },
    {
      aspect: "Creativity",
      value: user.aspects.creativity.level,
      fullMark: 12,
    },
    { aspect: "Social", value: user.aspects.social.level, fullMark: 12 },
  ];

  // Calculate total XP for the week
  const totalWeeklyXP = mockWeeklyXP.reduce((sum, day) => sum + day.xp, 0);

  // use shared hexToRgba util and accent colors
  const accent = getAccentColors(user.masteryTitle);
  const hexToRgba = hexToRgbaUtil;

  const getAspectColor = (category: AspectType) => {
    return ASPECT_COLORS[category].primary;
  };

  return (
    <main className="w-full md:w-[90%] lg:w-[80%] xl:w-[80%] mx-auto md:px-5 overflow-hidden">
      <div className="flex-1 min-h-screen pb-16 md:pb-6 py-2 md:py-6 md:px-4 overflow-y-auto">
        {/* PROFILE HEADER */}
        <div className="mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-6 mb-4">
                <div className="relative">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      width={80}
                      height={80}
                      alt={user.username}
                      className="rounded-full object-cover aspect-square"
                    />
                  ) : (
                    // avatar gradient now uses user's mastery colors
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
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

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{user.fullname}</h1>
                    {/* mastery badge uses mastery color instead of hardcoded blue */}
                    <span className="text-sm opacity-50 px-2 py-0.5 rounded">
                      @{user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span
                      className="font-semibold text-rookie"
                      style={{
                        color: accent.primary,
                      }}
                    >
                      {user.masteryTitle}
                    </span>
                    <span>•</span>
                    <span>Life Level {user.lifeLevel}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mb-3">
                    <div className="text-center">
                      <div className="font-bold text-lg">{stats.posts}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Posts
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{stats.followers}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Followers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{stats.following}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Following
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="font-semibold">{stats.bio}</p>

              <div className="space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  {stats.tagline}
                </p>
              </div>
              {/* Ongoing Goals */}
              <div className="mt-6">
                <h3 className="font-bold text-sm mb-3">Ongoing Goals</h3>
                <div className="flex gap-2 flex-wrap">
                  {mockGoals.map((goal) => (
                    <span
                      key={goal.id}
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: hexToRgba(
                          getAspectColor(goal.category),
                          0.15
                        ),
                        border: `1px solid ${getAspectColor(goal.category)}`,
                        color: getAspectColor(goal.category),
                      }}
                    >
                      {goal.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 text-white font-semibold py-2 px-4 rounded-lg transition hover:brightness-90"
                  style={{ backgroundColor: accent.primary }}
                >
                  Edit Profile
                </button>
                <button className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold py-2 px-4 rounded-lg transition">
                  Share Profile
                </button>
              </div>
            </div>

            {/* Right: Radar Chart */}
            <div className="lg:w-96 flex items-center justify-center">
              <div className="relative w-full h-[300px]">
                <RadarChart
                  data={radarData}
                  masteryTitle={user.masteryTitle}
                  username="Jason"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STREAK, LIFE LEVEL, XP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-2 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-900 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <span className="text-xl items-center flex">
                {/* fire icon */}
                <Flame
                  className="text-yellow-400 dark:text-yellow-700"
                  fill="currentColor"
                />
              </span>
              <span className="text-sm font-medium">Streak Count</span>
            </div>
            <div className="text-3xl font-bold">{stats.streakCount}</div>
          </div>

          <div className="bg-white dark:bg-dark-2 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-900 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Life Level {user.lifeLevel}
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              Member since {stats.memberSince}
            </div>
          </div>

          <div className="bg-white dark:bg-dark-2 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-900 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.currentXP} XP
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              Mastery unlocks at {stats.xpToMastery.toLocaleString()}
            </div>
          </div>
        </div>

        {/* WEEKLY XP CHART */}
        <div className="mb-6">
          <XPChart
            data={mockWeeklyXP}
            username={user.username}
            totalXP={totalWeeklyXP}
            accentColor={accent.primary}
            gradientStart={accent.gradStart}
            gradientEnd={accent.gradEnd}
          />
        </div>

        {/* TOP ACTIVITIES & RECENT SESSIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Activities */}
          <div className="bg-white dark:bg-dark-2 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-900">
            <h2 className="text-xl font-bold mb-4">Top Activities</h2>
            <div className="space-y-3">
              {mockActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 dark:text-gray-600 font-semibold w-6">
                      {index + 1}
                    </span>
                    <span className="text-2xl">{activity.icon}</span>
                    <span className="font-medium">{activity.name}</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    {activity.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-dark-2 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-900">
            <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
            <ul className="space-y-3">
              {mockSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{session.icon}</span>
                    <div>
                      <div className="font-medium">{session.activity}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {session.timestamp}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                    {session.duration}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* EXPERIENCES */}
        <div className="bg-white dark:bg-dark-2 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-900">
          <h2 className="text-xl font-bold mb-4">Experiences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockExperiences.map((exp) => (
              <div
                key={exp.id}
                className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {exp.title}
                    </h3>
                    {exp.description && (
                      <p className="text-white/80 text-xs mt-1">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
