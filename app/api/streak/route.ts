import { proxyStreak } from "./proxy";

export async function GET(request: Request) { return proxyStreak(request); }
export async function PATCH(request: Request) { return proxyStreak(request); }
