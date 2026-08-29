import type { Metadata } from "next";
import { headers } from "next/headers";
import ActivityClient from "./ActivityClient";

interface PageProps {
  params: Promise<{ activity: string }>;
}

type PublicActivity = {
  name: string;
  description: string | null;
  emoji: string;
  total_xp: number;
};

// Server-side only — runs unauthenticated (link-preview crawlers carry no
// session cookie). ActivityDetailView is already IsAuthenticatedOrReadOnly,
// so unlike the goal page this hits the same public endpoint the client uses.
async function fetchPublicActivity(uid: string): Promise<PublicActivity | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/v1/activities/${encodeURIComponent(uid)}/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicActivity;
  } catch {
    return null;
  }
}

// Activity.emoji (backend) is already "the last character of description, if
// it's an emoji, else a per-aspect-type fallback" — see main/models.py. The
// link-preview description text should show the description WITHOUT that
// trailing emoji (it's shown in the image instead), so strip it back off
// only when it's actually present at the end of the raw description.
function descriptionWithoutTrailingEmoji(description: string | null): string | undefined {
  if (!description) return undefined;
  const chars = Array.from(description);
  const last = chars[chars.length - 1];
  // Matches the codepoint ranges Django's `emoji.is_emoji` accepts closely
  // enough for display purposes — this only decides whether to trim a
  // trailing character from preview text, not anything security-sensitive.
  if (last && /\p{Extended_Pictographic}/u.test(last)) {
    return chars.slice(0, -1).join("").trimEnd() || undefined;
  }
  return description;
}

// Link-preview metadata for /a/<activity> — title is "Activity name (total
// XP/hr)", description is the activity's own description with its trailing
// emoji stripped (that emoji is shown in the image instead), image is the
// activity's emoji rendered by /api/og/emoji, falling back to the GamiLife
// logo when no emoji artwork can be fetched.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { activity: uid } = await params;
  const activity = await fetchPublicActivity(uid);

  if (!activity) {
    return { title: "GamiLife", description: "Redefine your Life" };
  }

  const title = `${activity.name} (${activity.total_xp.toLocaleString()} XP/hr)`;
  const description = descriptionWithoutTrailingEmoji(activity.description);

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = host ? `${protocol}://${host}` : undefined;

  const imageUrl = origin
    ? `${origin}/api/og/emoji?${new URLSearchParams({
        emoji: activity.emoji || "",
        fallback: `${origin}/logolight.png`,
      })}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function ActivityDetailPage() {
  return <ActivityClient />;
}
