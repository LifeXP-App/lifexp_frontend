"use client";

import React from "react";
import Image from "next/image";
import AspectChip from "../goals/AspectChip";
import { BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import { BiDumbbell } from "react-icons/bi";
import { FaBrain, FaHammer } from "react-icons/fa";

type Accent = {
  primary: string;
  secondary?: string;
};

type AspectXP = {
  physique: number;
  energy: number;
  social: number;
  creativity: number;
  logic: number;
};

type AspectTint = keyof AspectXP;

type AchievementProps = {
  emoji?: string;
  title: string;
  description?: string;
  xp: number | string;
  xpLabel?: string;
  coverImage?: string | null;
  timeText?: string;
  accent?: Accent;
  stats?: AspectXP;
  compact?: boolean;
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
  stats = { physique: 0, energy: 0, social: 0, creativity: 0, logic: 0 },
  compact = false,
}: AchievementProps) {
  const secondary = accent.secondary ?? "#4168e2";

  const chips = [
    { icon: <BiDumbbell className="w-3.5 h-3.5" />, value: stats.physique, tint: "physique" as AspectTint },
    { icon: <BoltIcon className="w-3.5 h-3.5" />, value: stats.energy, tint: "energy" as AspectTint },
    { icon: <UsersIcon className="w-3.5 h-3.5" />, value: stats.social, tint: "social" as AspectTint },
    { icon: <FaBrain className="w-3.5 h-3.5" />, value: stats.creativity, tint: "creativity" as AspectTint },
    { icon: <FaHammer className="w-3.5 h-3.5" />, value: stats.logic, tint: "logic" as AspectTint },
  ].sort((a, b) => b.value - a.value);

  if (compact) {
    return (
      <div className="cursor-pointer active:opacity-90 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151618] overflow-hidden flex flex-col p-4 gap-2">
        {/* Header row: emoji + title + XP */}
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-base text-black dark:text-white leading-tight truncate">
                {title}
              </p>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${accent.primary}, ${secondary})`,
                }}
              >
                +{xp} {xpLabel}
              </span>
            </div>
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 5.25a.75.75 0 0 0-1.5 0v4.25c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V7.5Z"
              clipRule="evenodd"
            />
          </svg>
          {timeText}
        </p>

        {/* Aspect chips */}
        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {chips.map((chip, index) => (
            <span className={index >= 2 ? "opacity-40" : ""} key={chip.tint}>
              <AspectChip icon={chip.icon} value={chip.value} tint={chip.tint} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cursor-pointer active:opacity-90 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151618] overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="relative h-36 w-full shrink-0">
        {coverImage ? (
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority={false}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `#333333`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute top-3 right-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-white border border-white/20 backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${accent.primary}, ${secondary})`,
            }}
          >
            +{xp} {xpLabel}
          </span>
        </div>
        <div className="absolute -bottom-5 left-4">
          <span className="text-2xl drop-shadow bg-white border rounded-xl w-12 h-12 flex justify-center items-center aspect-square border-gray-200">
            {emoji}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 mt-4 flex flex-col flex-1 gap-2">
        <p className="font-semibold text-base text-black dark:text-white leading-tight">
          {title}
        </p>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-auto pt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 5.25a.75.75 0 0 0-1.5 0v4.25c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V7.5Z"
              clipRule="evenodd"
            />
          </svg>
          {timeText}
        </p>

        {/* Aspect chips */}
        <div className="grid grid-cols-5 gap-1.5 mt-2">
          {chips.map((chip, index) => (
            <span className={index >= 2 ? "opacity-40" : ""} key={chip.tint}>
              <AspectChip icon={chip.icon} value={chip.value} tint={chip.tint} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
