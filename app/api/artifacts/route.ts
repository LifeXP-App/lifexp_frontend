import { passThrough, proxyAuthFetch } from "@/src/lib/auth/proxyAuthFetch";

const base = () => `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/v1/artifacts/`;

export async function GET(req: Request) {
  const { search } = new URL(req.url);
  return passThrough(await proxyAuthFetch(req, `${base()}${search}`));
}

export async function POST(req: Request) {
  const formData = await req.formData();
  return passThrough(await proxyAuthFetch(req, base(), { method: "POST", body: formData }));
}
