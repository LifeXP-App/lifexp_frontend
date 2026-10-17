"use client";

import { useId, type CSSProperties } from "react";
import { Flame } from "lucide-react";
import { INFERNO_STOPS, INFERNO_TEXT_GRADIENT, flameColor } from "@/src/components/streaks/flames";

// A filled flame in its tier color. Inferno gets a vertical gradient instead
// of a flat color so the top tier reads as a step up, not just another hue.
export function FlameIcon({
  name,
  className = "",
  strokeWidth,
  muted = false,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
  // Greyed out (e.g. a streak that isn't alive).
  muted?: boolean;
}) {
  const id = useId();
  if (muted || name !== "Inferno") {
    return (
      <Flame
        aria-hidden="true"
        className={`fill-current ${className}`}
        strokeWidth={strokeWidth}
        style={{ color: muted ? "#6b7280" : flameColor(name) }}
      />
    );
  }
  const gradientId = `inferno-${id.replace(/:/g, "")}`;
  return (
    <span className={`relative inline-flex ${className}`} aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            {INFERNO_STOPS.map((color, i) => (
              <stop key={color} offset={`${(i / (INFERNO_STOPS.length - 1)) * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
      </svg>
      <Flame className="h-full w-full" fill={`url(#${gradientId})`} stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} />
    </span>
  );
}

// Flame name text, gradient for Inferno.
export function FlameName({ name, className = "", children }: { name: string; className?: string; children?: React.ReactNode }) {
  const style: CSSProperties =
    name === "Inferno"
      ? { backgroundImage: INFERNO_TEXT_GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
      : { color: flameColor(name) };
  return <span className={className} style={style}>{children ?? name}</span>;
}
