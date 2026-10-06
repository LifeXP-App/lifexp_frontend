import { proxyStreak } from "../proxy";
export function GET(request: Request) {
  const before = new URL(request.url).searchParams.get("before");
  return proxyStreak(request, `timeline/${before ? `?before=${encodeURIComponent(before)}` : ""}`);
}
