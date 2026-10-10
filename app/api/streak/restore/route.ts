import { proxyStreak } from "../proxy";

export async function POST(request: Request) {
  return proxyStreak(request, "restore/");
}
