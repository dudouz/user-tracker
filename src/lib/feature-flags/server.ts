import type { FeatureFlagKey } from "@/lib/feature-flags/keys";
import { isPostHogServerEnabled } from "@/lib/posthog/config";
import { getServerPostHog } from "@/lib/posthog/posthog-server";

/**
 * Server-side flag check (e.g. API routes). Returns `undefined` if PostHog is off or on error.
 */
export async function isServerFeatureEnabled(
  key: FeatureFlagKey,
  distinctId: string,
) {
  if (!isPostHogServerEnabled()) return undefined;
  const client = getServerPostHog();
  if (!client) return undefined;
  const result = await client.isFeatureEnabled(key, distinctId);
  await client.flush();
  return result;
}
