/**
 * Reject open-redirects: only same-origin path redirects (leading slash, not //).
 */
export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback: string = "/dashboard",
) {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallback;
  }
  return callbackUrl;
}
