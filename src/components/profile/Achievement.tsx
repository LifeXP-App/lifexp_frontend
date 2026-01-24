"use client";

import React from "react";
import Image from "next/image";

import AspectChip from "../goals/AspectChip";

import { FireIcon, BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import { BiDumbbell } from "react-icons/bi";
import { FaBrain, FaHammer } from "react-icons/fa";

type Accent = {
  primary: string; // e.g. "#8d2e2e" or "var(--rookie-primary)"
  secondary?: string; // optional for gradient
};

type AspectXP = {
  physique: number;
  energy: number;
  social: number;
  creativity: number;
  logic: number;
};


type AchievementProps = {
  emoji?: string;
  title: string;
  description?: string;

  xp: number | string;
  xpLabel?: string; // default "XP"

  coverImage: string;

  timeText?: string; // e.g. "12h 30m over 3 months"


  accent?: Accent;

  stats?: AspectXP;

};

export default function Achievement({
  emoji = "🏆",
  title,
  description,
  xp,
  xpLabel = "XP",
  coverImage,
  timeText = "—",


  accent = { primary: "var(--rookie-primary)", secondary: "#4168e2" },
  stats = {physique: 0, energy: 0, social: 0, creativity: 0, logic: 0},


}: AchievementProps) {
  const secondary = accent.secondary ?? "#4168e2";

  return (
    <div
      className={`w-full cursor-pointer active:opacity-90 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151618] overflow-hidden `}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left Cover */}
        <div className="relative w-full sm:w-[300px] h-[160px] sm:h-auto">
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority={false}
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/20 to-transparent" />

        

        </div>

        {/* Right Content */}
        <div className="w-full p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 w-full">
              <div className="text-2xl leading-none mt-0.5">{emoji}</div>

              <div className="w-full">
                <div className="flex w-full items-center justify-between gap-2">
                  <p className="font-semibold text-lg text-black dark:text-white truncate">
                    {title}
                  </p>

                  <span
                    className="shrink-0 rounded-full px-4 py-1 text-xs font-bold text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${accent.primary}, ${secondary})`,
                    }}
                  >
                    +{xp}
                    {xpLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-md text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Time */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center justify-center">
              {/* clock icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 5.25a.75.75 0 0 0-1.5 0v4.25c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>{timeText}</span>
          </div>

          {/* Stats */}
           <div className="mt-4 grid grid-cols-5 gap-2">
                    {[
                    {
                        icon: <BiDumbbell className="w-4 h-4" />,
                        value: stats.physique,
                        tint: "physique",
                    },
                    {
                        icon: <BoltIcon className="w-4 h-4" />,
                        value: stats.energy,
                        tint: "energy",
                    },
                    {
                        icon: <UsersIcon className="w-4 h-4" />,
                        value: stats.social,
                        tint: "social",
                    },
                    {
                        icon: <FaBrain className="w-4 h-4" />,
                        value: stats.creativity,
                        tint: "creativity",
                    },
                    {
                        icon: <FaHammer className="w-4 h-4" />,
                        value: stats.logic,
                        tint: "logic",
                    },
                    ].map((chip) => (
                    <AspectChip
                        key={chip.tint}
                        icon={chip.icon}
                        value={chip.value}
                        tint={chip.tint as any}
                    />
                    ))}
                </div>


        </div>
      </div>
    </div>
  );
}
