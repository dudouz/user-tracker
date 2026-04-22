/**
 * Create matching flags in PostHog and keep keys in sync with this map.
 */
export const FEATURE_FLAGS = {
  /** Replace the value with your real flag key from PostHog. */
  newFeature: "new_feature",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
