import { passThrough, proxyAuthFetch } from "@/src/lib/auth/proxyAuthFetch";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  return passThrough(
    await proxyAuthFetch(
      req,
      `${process.env.NEXT_PUBLIC_API_BASE_URL!}/api/v1/artifacts/${id}/versions/`,
      { method: "POST", body: formData },
    ),
  );
}
