import { DocumentTextIcon, MusicalNoteIcon, PhotoIcon } from "@heroicons/react/24/outline";

export type ArtifactType = "image" | "audio" | "text";

export interface ArtifactVersion {
  id: number;
  version: number;
  version_date: string; // YYYY-MM-DD
  file_url: string | null;
  text: string;
  created_at: string;
}

export interface Artifact {
  id: number;
  title: string;
  type: ArtifactType;
  version_count: number;
  latest: {
    version: number;
    version_date: string;
    file_url: string | null;
    text_preview: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ArtifactDetail extends Artifact {
  versions: ArtifactVersion[];
}

// Per-type look: teal image, cyan audio, grayish blue text.
export const ARTIFACT_META: Record<
  ArtifactType,
  { label: string; color: string; Icon: typeof PhotoIcon }
> = {
  image: { label: "Image", color: "#14b8a6", Icon: PhotoIcon },
  audio: { label: "Audio", color: "#06b6d4", Icon: MusicalNoteIcon },
  text: { label: "Writing", color: "#7f93ad", Icon: DocumentTextIcon },
};

// "YYYY-MM-DD" -> "Oct 12, 2026" (parsed as a local date so it never shifts a day).
export function formatArtifactDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
