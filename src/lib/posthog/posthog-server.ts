import { PostHog } from "posthog-node";

import { getPostHogHost, getPostHogServerKey } from "@/lib/posthog/config";

let serverClient: PostHog | null = null;

export function getServerPostHog(): PostHog | null {
  const key = getPostHogServerKey();
  if (!key) return null;
  if (!serverClient) {
    serverClient = new PostHog(key, {
      host: getPostHogHost(),
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return serverClient;
}
