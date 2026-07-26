type ApiErrorPayload = {
  detail?: unknown;
  error?: unknown;
};

export async function getResponseError(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  const message = payload?.detail ?? payload?.error;

  return typeof message === "string" && message.trim()
    ? message
    : `${fallback} (${response.status})`;
}
