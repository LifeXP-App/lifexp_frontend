import React from "react";
import { FireIcon, BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";
import { BiDumbbell } from "react-icons/bi";
export type ActivityType = "physique" | "energy" | "social" | "creativity" | "logic";

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: React.ReactNode; cssColorVar: string; cssColorVarRgb:string }
> = {
  physique: {
    label: "Physique",
    icon: <BiDumbbell className="w-4 h-4" />,
    cssColorVar: "var(--aspect-physique)",
    cssColorVarRgb: "var(--aspect-physique-rgb)",
  },
  energy: {
    label: "Energy",
    icon: <BoltIcon className="w-4 h-4" />,
    cssColorVar: "var(--aspect-energy)",
    cssColorVarRgb: "var(--aspect-energy-rgb)",
  },
  social: {
    label: "Social",
    icon: <UsersIcon className="w-4 h-4" />,
    cssColorVar: "var(--aspect-social)",
    cssColorVarRgb: "var(--aspect-social-rgb)",
  },
  creativity: {
    label: "Creativity",
    icon: <FaBrain className="w-4 h-4" />,
    cssColorVar: "var(--aspect-creativity)",
    cssColorVarRgb: "var(--aspect-creativity-rgb)",
  },
  logic: {
    label: "Logic",
    icon: <FaHammer className="w-4 h-4" />,
    cssColorVar: "var(--aspect-logic)",
    cssColorVarRgb: "var(--aspect-logic-rgb)",
  },
};
