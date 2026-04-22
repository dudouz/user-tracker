/**
 * Public base URL for invite copy-link, emails, and sign-up `?ref=` links.
 *
 * Set `NEXT_PUBLIC_APP_URL` in production (e.g. `https://yourdomain.com`).
 * If unset: uses `https://${VERCEL_URL}` on Vercel, otherwise `http://localhost:3000`.
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
