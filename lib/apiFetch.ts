// lib/apiFetch.ts
import { redirect } from "next/navigation";

export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/users/login");
  }

  return res;
}
