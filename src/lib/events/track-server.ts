import type { AnalyticsEvent } from "@/lib/events/types";
import { eventPropertiesToJson } from "@/lib/events/types";
import { isPostHogServerEnabled } from "@/lib/posthog/config";
import { getServerPostHog } from "@/lib/posthog/posthog-server";

export async function trackServerEvent(
  event: AnalyticsEvent,
  options: { distinctId: string },
) {
  if (!isPostHogServerEnabled()) return;
  const client = getServerPostHog();
  if (!client) return;
  client.capture({
    distinctId: options.distinctId,
    event: event.name,
    properties: eventPropertiesToJson(event),
  });
  await client.flush();
}

export async function trackUserActivated(
  distinctId: string,
  referralId: string,
) {
  await trackServerEvent(
    { name: "user_activated", properties: { referral_id: referralId } },
    { distinctId },
  );
}
