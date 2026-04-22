/**
 * Public base URL for links (invite emails, copy-link). Set NEXT_PUBLIC_APP_URL
 * in production; falls back to Vercel or localhost in dev.
 */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
