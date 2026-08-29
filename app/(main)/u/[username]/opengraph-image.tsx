import { ImageResponse } from "next/og";
import getAccentColors from "@/src/components/UserAccent";
import { toRoman } from "@/src/lib/utils/toRoman";

export const runtime = "nodejs";
export const alt = "LifeXP profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Aspect = "physique" | "energy" | "social" | "creativity" | "logic";

type ProfileData = {
  fullname?: string;
  username: string;
  avatar?: string | null;
  masteryTitle?: string;
  masteryLevel?: number;
  totalXP?: number;
  visibility?: "public" | "private";
  aspects?: Record<Aspect, { currentXP: number }>;
};

type Goal = { title: string; emoji?: string | null };

async function fetchProfile(username: string): Promise<ProfileData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/v1/users/${encodeURIComponent(username)}/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ProfileData;
  } catch {
    return null;
  }
}

async function fetchOngoingGoals(username: string): Promise<Goal[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(
      `${baseUrl}/api/v1/users/${encodeURIComponent(username)}/goals/?status=ongoing`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data.results || []) as Goal[];
  } catch {
    return [];
  }
}

// Sunday-to-Saturday ordering isn't relevant here — this mirrors the same
// aspect order RadarChart's caller uses (src/app/(main)/u/[username]/page.tsx)
// so the polygon shape matches the live chart.
const ASPECT_ORDER: { key: Aspect; label: string }[] = [
  { key: "physique", label: "Physique" },
  { key: "energy", label: "Energy" },
  { key: "social", label: "Social" },
  { key: "creativity", label: "Creativity" },
  { key: "logic", label: "Logic" },
];

// Standalone re-implementation of RadarChart.tsx's pentagon geometry as raw
// SVG — ImageResponse renders via Satori, which cannot execute Recharts (an
// interactive DOM/canvas library), only plain HTML-like JSX and static SVG.
function buildRadarPolygon(
  values: number[],
  center: number,
  radius: number,
): { grid: string[]; polygon: string; points: { x: number; y: number }[] } {
  const maxValue = Math.max(...values, 100);
  const angleStep = (Math.PI * 2) / values.length;
  // Start at the top (12 o'clock), matching Recharts' default PolarAngleAxis.
  const startAngle = -Math.PI / 2;

  // 4 concentric grid rings, same RADIAL_TICK_STEPS convention as RadarChart.
  const grid = [0.25, 0.5, 0.75, 1].map((ring) => {
    const pts = ASPECT_ORDER.map((_, i) => {
      const angle = startAngle + angleStep * i;
      const x = center + radius * ring * Math.cos(angle);
      const y = center + radius * ring * Math.sin(angle);
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")} Z`;
  });

  const dataPoints = values.map((value, i) => {
    const angle = startAngle + angleStep * i;
    const r = radius * Math.min(1, value / maxValue);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });

  const polygon = `M ${dataPoints.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;

  return { grid, polygon, points: dataPoints };
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0E0E12",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          LifeXP
        </div>
      ),
      { ...size },
    );
  }

  const accent = getAccentColors(profile.masteryTitle || "rookie");
  const isRookie = (profile.masteryTitle || "Rookie") === "Rookie";
  const isPrivate = profile.visibility === "private";

  const goals = isPrivate ? [] : await fetchOngoingGoals(username);

  const aspectValues = ASPECT_ORDER.map(
    ({ key }) => profile.aspects?.[key]?.currentXP ?? 0,
  );
  const { grid, polygon } = buildRadarPolygon(aspectValues, 160, 130);

  const displayName = profile.fullname || profile.username;
  const masteryLabel = `${profile.masteryTitle || "Rookie"}${
    !isRookie && profile.masteryLevel ? ` ${toRoman(profile.masteryLevel)}` : ""
  }`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0E0E12",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: profile info */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                width={112}
                height={112}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: "50%",
                  background: "#2A2A30",
                  display: "flex",
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>
                {displayName}
              </div>
              <div style={{ fontSize: 24, color: "#9aa0ae" }}>@{profile.username}</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              fontWeight: 700,
              color: accent.text,
            }}
          >
            {masteryLabel}
          </div>

          <div style={{ marginTop: 8, fontSize: 22, color: "#9aa0ae" }}>
            {(profile.totalXP ?? 0).toLocaleString()} XP
          </div>

          {!isPrivate && goals.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32, maxWidth: 480 }}>
              {goals.slice(0, 5).map((goal, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 999,
                    fontSize: 18,
                    fontWeight: 500,
                    color: accent.primary,
                    backgroundColor: `${accent.primary}26`,
                    border: `1px solid ${accent.primary}`,
                  }}
                >
                  <span>{goal.emoji || "🎯"}</span>
                  <span>{goal.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: radar chart */}
        {!isPrivate && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 420 }}>
            <svg width={340} height={340} viewBox="0 0 320 320">
              {grid.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#3a3a42" strokeWidth={1} />
              ))}
              <path
                d={polygon}
                fill={accent.primary}
                fillOpacity={0.25}
                stroke={accent.primary}
                strokeWidth={2}
              />
            </svg>
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
