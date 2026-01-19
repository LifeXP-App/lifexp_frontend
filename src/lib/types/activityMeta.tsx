import React from "react";
import { FireIcon, BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";

export type ActivityType = "physique" | "energy" | "social" | "creativity" | "logic";

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: React.ReactNode; cssColorVar: string }
> = {
  physique: {
    label: "Physique",
    icon: <FireIcon className="w-4 h-4" />,
    cssColorVar: "var(--aspect-physique)",
  },
  energy: {
    label: "Energy",
    icon: <BoltIcon className="w-4 h-4" />,
    cssColorVar: "var(--aspect-energy)",
  },
  social: {
    label: "Social",
    icon: <UsersIcon className="w-4 h-4" />,
    cssColorVar: "var(--aspect-social)",
  },
  creativity: {
    label: "Creativity",
    icon: <FaBrain className="w-4 h-4" />,
    cssColorVar: "var(--aspect-creativity)",
  },
  logic: {
    label: "Logic",
    icon: <FaHammer className="w-4 h-4" />,
    cssColorVar: "var(--aspect-logic)",
  },
};
