import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

type PublicProfile = {
  fullname?: string;
  username: string;
  avatar?: string | null;
};

// Server-side only — runs unauthenticated (link-preview crawlers carry no
// session cookie), so this hits Django's public GET /api/v1/users/<username>/
// directly rather than the app's cookie-authenticated Next proxy routes.
async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/v1/users/${encodeURIComponent(username)}/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicProfile;
  } catch {
    return null;
  }
}

// Link-preview metadata for /u/<username> — title is the display name,
// description is @username, image is their actual profile picture (no
// generated composite image; that approach kept failing in production).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchPublicProfile(username);

  if (!profile) {
    return { title: "GamiLife", description: "Redefine your Life" };
  }

  const displayName = profile.fullname || profile.username;
  const description = `@${profile.username}`;

  return {
    title: displayName,
    description,
    openGraph: {
      title: displayName,
      description,
      images: profile.avatar ? [{ url: profile.avatar }] : undefined,
    },
    twitter: {
      card: "summary",
      title: displayName,
      description,
      images: profile.avatar ? [profile.avatar] : undefined,
    },
  };
}

export default function ProfilePage({ params }: PageProps) {
  return <ProfileClient params={params} />;
}
