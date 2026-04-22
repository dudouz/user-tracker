"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

import { getPostHogHost, getPostHogPublicKey } from "@/lib/posthog/config";

const apiKey = getPostHogPublicKey();
const apiHost = getPostHogHost();

// Initialize the posthog singleton eagerly on the client so that events
// captured in child components' mount effects aren't dropped while the
// provider's own effect has yet to run. React runs child effects before
// parent effects, so relying on <PostHogProvider apiKey=... /> to init
// creates a race where `posthog.__loaded` is still false.
if (typeof window !== "undefined" && apiKey && !posthog.__loaded) {
  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
}

export function AppPostHogProvider({ children }: { children: ReactNode }) {
  if (!apiKey) {
    return children;
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
