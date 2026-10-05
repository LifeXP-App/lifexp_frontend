import { authedFetch } from "./authedFetch";

export async function readNotification(id: string): Promise<boolean> {
  try {
    const response = await authedFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}
