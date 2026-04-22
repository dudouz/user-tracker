"use client";

import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

import { getPostHogHost, getPostHogPublicKey } from "@/lib/posthog/config";

const apiKey = getPostHogPublicKey();
const apiHost = getPostHogHost();

export function AppPostHogProvider({ children }: { children: ReactNode }) {
  if (!apiKey) {
    return children;
  }
  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{ api_host: apiHost }}
    >
      {children}
    </PostHogProvider>
  );
}
