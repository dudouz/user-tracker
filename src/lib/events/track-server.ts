import type { AnalyticsEvent } from "@/lib/events/types";
import { isPostHogServerEnabled } from "@/lib/posthog/config";
import { getServerPostHog } from "@/lib/posthog/posthog-server";

export async function trackServerEvents(
  events: AnalyticsEvent[],
  options: { distinctId: string },
): Promise<void> {
  if (events.length === 0 || !isPostHogServerEnabled()) return;
  const client = getServerPostHog();
  if (!client) return;
  try {
    for (const event of events) {
      client.capture({
        distinctId: options.distinctId,
        event: event.name,
        properties: event.properties,
      });
    }
    await client.flush();
  } catch {
    // analytics must never break the request
  }
}

export function trackServerEvent(
  event: AnalyticsEvent,
  options: { distinctId: string },
): Promise<void> {
  return trackServerEvents([event], options);
}
