import type { SignupStep, SignupWizardStepKey } from "@/lib/events/types";

/**
 * Descriptive step metadata. UI state still uses 1–3; analytics use `key` / `label` only.
 */
export const SIGNUP_WIZARD_STEPS: Record<
  SignupStep,
  { key: SignupWizardStepKey; label: string }
> = {
  1: {
    key: "account",
    label: "Account & invite",
  },
  2: {
    key: "location_interest",
    label: "Location & interest",
  },
  3: {
    key: "confirm",
    label: "Review & create account",
  },
};

export function getSignupWizardStepMeta(
  step: SignupStep,
): { key: SignupWizardStepKey; label: string; order: number } {
  const { key, label } = SIGNUP_WIZARD_STEPS[step];
  return { key, label, order: step };
}
