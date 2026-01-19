import React from 'react';
import {
  FireIcon,
  BoltIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";

export default
function AspectChip({
  icon,
  value,
  tint,
}: {
  icon: React.ReactNode;
  value: number;
  tint: "physique" | "energy" | "social" | "creativity" | "logic";
}) {
  const tintMap: Record<typeof tint, string> = {
    physique: "bg-[#8d2e2e]/30 text-[#8d2e2e]",
    energy: "bg-[#c49352]/30 text-[#c49352]",
    social: "bg-[#31784e]/30 text-[#31784e]",
    creativity: "bg-[#4187a2]/30 text-[#4187a2]",
    logic: "bg-[#713599]/30 text-[#713599]",
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${tintMap[tint]}`}
    >
      <span >{icon}</span>
      <span>{value}</span>
    </div>
  );
}