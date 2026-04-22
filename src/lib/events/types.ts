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
