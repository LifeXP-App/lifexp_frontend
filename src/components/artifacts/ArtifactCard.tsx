import { PlusIcon } from "@heroicons/react/24/outline";
import { markdownToPlain } from "@/src/lib/utils/markdown";
import {
  ARTIFACT_META,
  formatArtifactDate,
  type Artifact,
} from "@/src/lib/types/artifact";

// The media area takes whatever space the text leaves in the card.
const mediaBox = "relative w-full flex-1 min-h-0 overflow-hidden rounded-xl flex items-center justify-center";

// A plain frame: a 3px border that fades very slightly from the color to a
// lighter shade of it, a soft tinted fill, and a plus in the middle -- all in
// `color` (the active filter's color, or the mastery color for "All"). The
// border is the outer element's gradient showing around an opaque inner
// element, since CSS borders can't take gradients directly.
export function NewArtifactCard({ onClick, color }: { onClick: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="New artifact"
      title="New artifact"
      className="group block w-full aspect-[3/4] rounded-2xl p-[3px] cursor-pointer shadow-sm transition-shadow hover:shadow-md"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, white))`,
      }}
    >
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[13px] bg-gray-100 dark:bg-dark-1">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(145deg, color-mix(in srgb, ${color} 16%, transparent), color-mix(in srgb, ${color} 7%, transparent))`,
          }}
        />
        {/* Hover: the tint deepens a touch; the border never changes. */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
          style={{ backgroundColor: color }}
        />
        <PlusIcon className="relative w-12 h-12" style={{ color }} strokeWidth={1.75} />
      </span>
    </button>
  );
}

// Each type has its own shape: images are landscape (4 wide, 3 tall), text is
// portrait like a page (3 wide, 4 tall), and audio is a short, wide strip.
const SHAPE: Record<Artifact["type"], string> = {
  image: "aspect-[4/3] flex flex-col",
  text: "aspect-[3/4] flex flex-col",
  audio: "flex items-center gap-3",
};

export function ArtifactCard({ artifact, onClick }: { artifact: Artifact; onClick: () => void }) {
  const meta = ARTIFACT_META[artifact.type];
  const Icon = meta.Icon;
  const thumbnail = artifact.type === "image" ? artifact.latest?.file_url : null;
  const tint = `color-mix(in srgb, ${meta.color} 10%, transparent)`;

  const info = (
    <>
      <p className="px-1 font-semibold truncate text-black dark:text-[var(--foreground)]">
        {artifact.title || "Untitled"}
      </p>
      {artifact.type === "text" && artifact.latest?.text_preview && (
        <p className="px-1 text-xs text-gray-500 dark:text-[var(--muted)] line-clamp-2">
          {markdownToPlain(artifact.latest.text_preview)}
        </p>
      )}
      <p className="px-1 text-xs mt-0.5 truncate" style={{ color: meta.color }}>
        {artifact.version_count} {artifact.version_count === 1 ? "version" : "versions"}
        {artifact.latest && ` · ${formatArtifactDate(artifact.latest.version_date)}`}
      </p>
    </>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left rounded-2xl border-2 p-3 cursor-pointer transition hover:shadow-md ${SHAPE[artifact.type]}`}
      style={{ borderColor: meta.color, backgroundColor: tint }}
    >
      {artifact.type === "audio" ? (
        <>
          <div
            className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: tint }}
          >
            <Icon className="w-7 h-7" style={{ color: meta.color }} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">{info}</div>
        </>
      ) : (
        <>
          <div className={mediaBox} style={{ backgroundColor: tint }}>
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt={artifact.title} className="h-full w-full object-cover" />
            ) : (
              <Icon className="w-10 h-10" style={{ color: meta.color }} strokeWidth={1.5} />
            )}
          </div>
          <div className="mt-3">{info}</div>
        </>
      )}
    </button>
  );
}
