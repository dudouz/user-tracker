import posthog from "posthog-js";

import { isPostHogClientEnabled } from "@/lib/posthog/config";

export function identifyPostHogUser(userId: string) {
  if (typeof window === "undefined" || !isPostHogClientEnabled()) return;
  posthog.identify(userId);
}

export function resetPostHogUser() {
  if (typeof window === "undefined" || !isPostHogClientEnabled()) return;
  posthog.reset();
}
