import type { Metadata } from "next";
import { headers } from "next/headers";
import GoalDetailClient from "./GoalDetailClient";

interface PageProps {
  params: Promise<{ goalId: string }>;
}

type PublicGoal = {
  title: string;
  description: string | null;
  emoji: string;
  completion_picture_url: string | null;
  username: string;
  avatar: string | null;
};

// Server-side only — runs unauthenticated (link-preview crawlers carry no
// session cookie), so this hits Django's public GET /api/v1/goals/<uid>/public/
// directly rather than the app's cookie-authenticated Next proxy routes.
async function fetchPublicGoal(goalId: string): Promise<PublicGoal | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/v1/goals/${encodeURIComponent(goalId)}/public/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicGoal;
  } catch {
    return null;
  }
}

// Link-preview metadata for /goals/<goalId> — title is "@username / Goal
// title", description is the goal's own description, image is the goal's
// completion picture if it has one, else /api/og/goal-emoji: real emoji
// artwork on a white square when it can fetch one, else the goal owner's own
// profile picture, else a plain white square (see that route for why the
// emoji can't just be drawn as plain JSX/SVG text).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { goalId } = await params;
  const goal = await fetchPublicGoal(goalId);

  if (!goal) {
    return { title: "GamiLife", description: "Redefine your Life" };
  }

  const title = `@${goal.username} / ${goal.title}`;
  const description = goal.description || undefined;

  // Crawlers fetch the OG image independently of this page, so it must be an
  // absolute URL — build it from the incoming request's own host rather than
  // hardcoding a domain, so this works on preview deployments too.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = host ? `${protocol}://${host}` : undefined;

  const imageUrl = goal.completion_picture_url
    ? goal.completion_picture_url
    : origin
      ? `${origin}/api/og/goal-emoji?${new URLSearchParams({
          emoji: goal.emoji || "🎯",
          ...(goal.avatar ? { avatar: goal.avatar } : {}),
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

export default function GoalDetailPage() {
  return <GoalDetailClient />;
}
