"use client";

import { useEffect, useRef } from "react";

import {
  trackClientEvent,
  type AbandonReason,
  type SignupWizardStepContext,
} from "@/lib/events";

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Wizard-level abandon tracking. Fires `signup_wizard_abandoned` at most once
 * per session — when the user closes the tab or navigates away from the
 * wizard without successfully submitting. `time_on_step_ms` is measured
 * against the last step transition.
 */
export function useSignUpAbandonTracking({
  step,
  isSettling,
}: {
  step: SignupWizardStepContext;
  isSettling: boolean;
}) {
  const stepRef = useRef(step);
  const stepStartedAtRef = useRef(nowMs());
  const settlingRef = useRef(isSettling);
  const reportedRef = useRef(false);

  useEffect(() => {
    stepRef.current = step;
    stepStartedAtRef.current = nowMs();
  }, [step]);

  useEffect(() => {
    settlingRef.current = isSettling;
  }, [isSettling]);

  useEffect(() => {
    function report(reason: AbandonReason) {
      if (reportedRef.current || settlingRef.current) return;
      reportedRef.current = true;
      trackClientEvent({
        name: "signup_wizard_abandoned",
        properties: {
          ...stepRef.current,
          reason,
          time_on_step_ms: Math.max(
            0,
            Math.round(nowMs() - stepStartedAtRef.current),
          ),
        },
      });
    }
    function onPageHide() {
      report("tab_closed");
    }
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      report("navigated_away");
    };
  }, []);
}
