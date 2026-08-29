import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const SIZE = 256;
const FETCH_TIMEOUT_MS = 2000;

// Converts an emoji character to Twemoji's codepoint filename, e.g. "🎯" ->
// "1f3af". Ported from next/og's own internal emoji handling (Satori resolves
// emoji this same way when rendering plain JSX text) — reimplemented here
// because we fetch the SVG ourselves instead, with our own timeout/fallback,
// rather than depending on Satori's internal fetch (uncontrolled timeout, no
// fallback — a slow/blocked emoji fetch there previously crashed the whole
// image response).
function toCodePoints(text: string): string {
  const codepoints: string[] = [];
  const zeroWidthJoiner = String.fromCharCode(8205);
  const variationSelector16 = /️/g;
  const cleaned = text.includes(zeroWidthJoiner) ? text : text.replace(variationSelector16, "");

  for (const char of cleaned) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    codepoints.push(code.toString(16));
  }
  return codepoints.join("-");
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// Emoji artwork must come from real vector/bitmap art, not text — the
// serverless renderer (resvg, via next/og) has no emoji-capable font
// installed, so drawing the emoji as an SVG <text> node just produces a tofu
// box (missing-glyph rectangle) instead of the actual emoji.
async function fetchEmojiSvg(emoji: string): Promise<string | null> {
  const code = toCodePoints(emoji);
  if (!code) return null;

  try {
    const res = await fetchWithTimeout(
      `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`,
      FETCH_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function whiteSquare() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff" }} />
    ),
    { width: SIZE, height: SIZE },
  );
}

export async function GET(req: NextRequest) {
  const emoji = req.nextUrl.searchParams.get("emoji");
  const avatar = req.nextUrl.searchParams.get("avatar");

  if (!emoji) {
    if (avatar) {
      return Response.redirect(avatar, 302);
    }
    return whiteSquare();
  }

  const emojiSvg = await fetchEmojiSvg(emoji);

  // Real emoji artwork fetched successfully — render it on the white square.
  //
  // react-hooks/error-boundaries assumes normal React reconciliation (JSX
  // construction is lazy, so try/catch around it does nothing there).
  // ImageResponse/Satori is NOT React rendering: `new ImageResponse(jsx,
  // opts)` synchronously walks this tree right here to produce PNG bytes, so
  // this try/catch genuinely does catch its rendering failures.
  /* eslint-disable react-hooks/error-boundaries */
  if (emojiSvg) {
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
            <img src={svgDataUri(emojiSvg)} alt="" width={SIZE * 0.6} height={SIZE * 0.6} />
          </div>
        ),
        { width: SIZE, height: SIZE },
      );
    } catch (err) {
      console.error("Failed to render goal-emoji og image:", err);
      // Fall through to the avatar/white-square fallback below.
    }
  }
  /* eslint-enable react-hooks/error-boundaries */

  // No emoji artwork available — fall back to the goal owner's profile
  // picture if one was provided, otherwise a plain white square.
  if (avatar) {
    return Response.redirect(avatar, 302);
  }
  return whiteSquare();
}
