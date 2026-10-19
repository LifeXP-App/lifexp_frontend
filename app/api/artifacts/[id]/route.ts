import { passThrough, proxyAuthFetch } from "@/src/lib/auth/proxyAuthFetch";

const url = (id: string) => `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/v1/artifacts/${id}/`;
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return passThrough(await proxyAuthFetch(req, url(id)));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  return passThrough(
    await proxyAuthFetch(req, url(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return passThrough(await proxyAuthFetch(req, url(id), { method: "DELETE" }));
}
