/** Structurally matches both NextRequest.headers and next/headers()'s return type. */
type ReadableHeaders = { get(name: string): string | null };

/** Best-effort client IP extraction from proxy headers (Vercel and most reverse
 *  proxies set x-forwarded-for; x-real-ip is a common fallback). Not spoof-proof,
 *  but good enough to key the anonymous free-chat cap and footfall logging. */
export function getClientIp(headers: ReadableHeaders): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || null;
}
