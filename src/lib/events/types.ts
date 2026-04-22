export const ANALYTICS_EVENT_NAMES = [
  "signup_step_viewed",
  "signup_step_completed",
  "signup_validation_error",
  "signup_completed",
  "sign_in_completed",
  "referral_link_opened",
  "referral_signup_completed",
  "gallery_viewed",
  "photo_viewed",
  "comment_started",
  "comment_created",
  "user_activated",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

/** Internal UI step index only (not sent on analytics events). */
export type SignupStep = 1 | 2 | 3;

export type SignupWizardStepKey =
  | "account"
  | "location_interest"
  | "confirm";

export type SignupWizardAdvanceStepKey = "account" | "location_interest";

export type SignupWizardStepContext = {
  step_key: SignupWizardStepKey;
  step_label: string;
};

export type AnalyticsEvent =
  | { name: "signup_step_viewed"; properties: SignupWizardStepContext }
  | {
      name: "signup_step_completed";
      properties: {
        step_key: SignupWizardAdvanceStepKey;
        step_label: string;
      };
    }
  | {
      name: "signup_validation_error";
      properties: SignupWizardStepContext & { fields: string[]; code?: string };
    }
  | { name: "signup_completed"; properties: { has_referrer: boolean } }
  | { name: "sign_in_completed"; properties: { method?: "password" } }
  | { name: "referral_link_opened"; properties: { ref_present: true } }
  | { name: "referral_signup_completed"; properties: { referrer_id: string } }
  | { name: "gallery_viewed"; properties: { source?: string } }
  | { name: "photo_viewed"; properties: { photo_id: number } }
  | { name: "comment_started"; properties: { photo_id: number } }
  | {
      name: "comment_created";
      properties: { photo_id: number; content_length_bucket?: string };
    }
  | { name: "user_activated"; properties: { referral_id: string } };

export function eventPropertiesToJson(
  event: AnalyticsEvent,
): Record<string, unknown> {
  return event.properties;
}
