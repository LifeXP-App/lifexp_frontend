import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const SIZE = 256;

// Link-preview fallback for a goal with no completion picture: a small white
// square showing just the goal's emoji. Deliberately NOT rendered as plain
// JSX text — Satori resolves emoji by fetching each glyph as an SVG from a
// remote CDN (cdn.jsdelivr.net/twemoji) at render time, and a slow/blocked
// fetch there throws and fails the whole image (this crashed the profile
// page's link preview previously). Drawing the emoji into a small inline SVG
// ourselves and embedding it as a data: URI <img> sidesteps that code path
// entirely — Satori just treats it as a static image asset, no CDN involved.
function emojiDataUri(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<text x="50%" y="50%" font-size="140" text-anchor="middle" dominant-baseline="central">` +
    `${escapeXml(emoji)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const emoji = req.nextUrl.searchParams.get("emoji") || "🎯";

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={emojiDataUri(emoji)} alt="" width={SIZE} height={SIZE} />
        </div>
      ),
      { width: SIZE, height: SIZE },
    );
  } catch (err) {
    console.error("Failed to render goal-emoji og image:", err);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "#ffffff",
          }}
        />
      ),
      { width: SIZE, height: SIZE },
    );
  }
}
