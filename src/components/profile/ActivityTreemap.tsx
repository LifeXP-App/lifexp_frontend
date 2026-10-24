"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, Treemap } from "recharts";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

export type TreemapActivity = {
  key: string;
  uid?: string;
  name: string;
  emoji?: string;
  type?: ActivityType;
  seconds: number;
};

type Hovered = { key: string; x: number; y: number; width: number; name: string; seconds: number };

// What the Treemap hands the tile renderer: geometry plus our own fields.
type TileProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  key?: string;
  uid?: string;
  emoji?: string;
  color?: string;
  value?: number;
  payload?: Record<string, unknown>;
  root?: { width?: number; height?: number };
};

const FRAME_RADIUS = 15; // rounded-2xl (16px) minus the 1px border

// A rectangle whose corners are individually rounded (sharp where radius is 0).
function roundedRect(x: number, y: number, w: number, h: number, r: { tl: number; tr: number; br: number; bl: number }) {
  return [
    `M${x + r.tl},${y}`,
    `H${x + w - r.tr}`,
    r.tr ? `A${r.tr},${r.tr} 0 0 1 ${x + w},${y + r.tr}` : "",
    `V${y + h - r.br}`,
    r.br ? `A${r.br},${r.br} 0 0 1 ${x + w - r.br},${y + h}` : "",
    `H${x + r.bl}`,
    r.bl ? `A${r.bl},${r.bl} 0 0 1 ${x},${y + h - r.bl}` : "",
    `V${y + r.tl}`,
    r.tl ? `A${r.tl},${r.tl} 0 0 1 ${x + r.tl},${y}` : "",
    "Z",
  ].join(" ");
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours < 1) return `${Math.max(1, minutes)}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

// Top activities as one box cut into tiles sized by time spent (Recharts
// Treemap). Tiles are square-edged and filled with the activity's aspect
// color; the whole component is the card frame, and only its outer corners
// are rounded (it clips the chart).
// Hovering deepens a tile and shows its name and total time above it.
export default function ActivityTreemap({ activities }: { activities: TreemapActivity[] }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<Hovered | null>(null);

  const data = activities
    .filter((a) => a.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .map((a) => ({
      tileKey: a.key,
      name: a.name,
      value: a.seconds,
      uid: a.uid,
      emoji: a.emoji || "📊",
      color: a.type ? ACTIVITY_META[a.type].cssColorVar : "var(--muted)",
    }));

  const renderTile = (props: TileProps) => {
    const node = { ...(props.payload ?? {}), ...props } as TileProps & { tileKey?: string };
    const { x, y, width, height } = props;
    if (!width || !height || !node.name) return <g />;
    const key = node.tileKey ?? node.name;
    const isHovered = hovered?.key === key;
    const size = Math.min(width, height);
    // Only the tiles touching a corner of the frame get a rounded corner, so
    // nothing needs clipping and the inside stays sharp.
    const EPS = 1.5;
    const rootW = props.root?.width ?? 0;
    const rootH = props.root?.height ?? 0;
    const atLeft = x <= EPS;
    const atTop = y <= EPS;
    const atRight = rootW > 0 && x + width >= rootW - EPS;
    const atBottom = rootH > 0 && y + height >= rootH - EPS;
    const corners = {
      tl: atLeft && atTop ? FRAME_RADIUS : 0,
      tr: atRight && atTop ? FRAME_RADIUS : 0,
      br: atRight && atBottom ? FRAME_RADIUS : 0,
      bl: atLeft && atBottom ? FRAME_RADIUS : 0,
    };
    const inner = {
      tl: Math.max(0, corners.tl - 2),
      tr: Math.max(0, corners.tr - 2),
      br: Math.max(0, corners.br - 2),
      bl: Math.max(0, corners.bl - 2),
    };

    return (
      <g
        className={node.uid ? "cursor-pointer" : undefined}
        onMouseEnter={() =>
          setHovered({ key, x, y, width, name: node.name!, seconds: node.value ?? 0 })
        }
        onMouseLeave={() => setHovered((h) => (h?.key === key ? null : h))}
        onClick={() => node.uid && router.push(`/a/${node.uid}`)}
      >
        {/* Tinted fill; the card-colored stroke reads as a thin gap between tiles. */}
        <path
          d={roundedRect(x, y, width, height, corners)}
          className="stroke-white dark:stroke-dark-2"
          strokeWidth={3}
          style={{
            fill: node.color,
            fillOpacity: isHovered ? 0.5 : 0.26,
            transition: "fill-opacity 150ms",
          }}
        />
        {/* Crisp aspect-colored edge just inside the gap. */}
        <path
          d={roundedRect(x + 2, y + 2, Math.max(0, width - 4), Math.max(0, height - 4), inner)}
          fill="none"
          strokeWidth={1.5}
          style={{
            stroke: node.color,
            strokeOpacity: isHovered ? 1 : 0.6,
            transition: "stroke-opacity 150ms",
          }}
        />
        {size >= 24 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(14, Math.min(44, size * 0.4))}
            pointerEvents="none"
          >
            {node.emoji}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-2xl border border-gray-200 bg-white dark:border-[var(--border)] dark:bg-dark-2">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            nameKey="name"
            isAnimationActive={false}
            content={renderTile as never}
          />
        </ResponsiveContainer>
      </div>

      {hovered && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-lg dark:border-[var(--border)] dark:bg-dark-1"
          style={{ left: hovered.x + hovered.width / 2, top: hovered.y - 6 }}
        >
          <span className="block font-semibold text-black dark:text-[var(--foreground)]">{hovered.name}</span>
          <span className="block text-gray-500 dark:text-[var(--muted)]">{formatDuration(hovered.seconds)}</span>
        </div>
      )}
    </div>
  );
}
