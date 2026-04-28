/**
 * Single source of truth for the sign-up wizard.
 *
 * Each entry is shaped exactly like the analytics step context, so it can be
 * spread straight into a `trackClientEvent(...)` call with no translation
 * layer. The total step count and analytics types are all derived from this
 * tuple — no other module should hard-code step keys, labels, or counts.
 */
export const SIGNUP_WIZARD_STEPS = [
  { step_key: "account", step_label: "Account & invite" },
  { step_key: "location_interest", step_label: "Location & interest" },
  { step_key: "confirm", step_label: "Review & create account" },
] as const;

export type SignupWizardStep = (typeof SIGNUP_WIZARD_STEPS)[number];
export type SignupWizardStepKey = SignupWizardStep["step_key"];

/** Steps that advance the wizard — every step except the terminal `confirm`. */
export type SignupWizardAdvanceStepKey = Exclude<SignupWizardStepKey, "confirm">;

export const SIGNUP_STEP_TOTAL = SIGNUP_WIZARD_STEPS.length;

export type SignupWizardStepContext = {
  step_key: SignupWizardStepKey;
  step_label: string;
};
