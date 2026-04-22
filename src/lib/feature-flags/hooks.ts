"use client";

import { useFeatureFlagEnabled } from "posthog-js/react";

import type { FeatureFlagKey } from "@/lib/feature-flags/keys";

/** `undefined` while PostHog is still loading flag state. */
export function useAppFeatureFlagEnabled(
  key: FeatureFlagKey,
): boolean | undefined {
  return useFeatureFlagEnabled(key);
}
