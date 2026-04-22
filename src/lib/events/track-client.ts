import posthog from "posthog-js";

import type { AnalyticsEvent } from "@/lib/events/types";
import { eventPropertiesToJson } from "@/lib/events/types";
import { isPostHogClientEnabled } from "@/lib/posthog/config";

export function trackClientEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined" || !isPostHogClientEnabled()) return;
  if (!posthog.__loaded) return;
  posthog.capture(event.name, eventPropertiesToJson(event));
}
