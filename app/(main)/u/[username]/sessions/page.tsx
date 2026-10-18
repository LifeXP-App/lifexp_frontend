import type { Metadata } from "next";
import { Suspense } from "react";
import SessionsClient from "./SessionsClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}'s sessions - Gamilife` };
}

export default function UserSessionsPage({ params }: PageProps) {
  // SessionsClient reads ?day= via useSearchParams.
  return (
    <Suspense>
      <SessionsClient params={params} />
    </Suspense>
  );
}
