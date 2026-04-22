const DEFAULT_HOST = "https://us.i.posthog.com";

export function getPostHogPublicKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return k && k.length > 0 ? k : undefined;
}

/** Prefer server-only key in production; falls back to the public key for local dev. */
export function getPostHogServerKey(): string | undefined {
  const secret = process.env.POSTHOG_KEY;
  if (secret && secret.length > 0) return secret;
  return getPostHogPublicKey();
}

export function getPostHogHost(): string {
  const h = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (h && h.length > 0) return h;
  return DEFAULT_HOST;
}

export function isPostHogClientEnabled(): boolean {
  return Boolean(getPostHogPublicKey());
}

export function isPostHogServerEnabled(): boolean {
  return Boolean(getPostHogServerKey());
}
