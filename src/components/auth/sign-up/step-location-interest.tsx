"use client";

import { useEffect } from "react";
import type { FieldPath } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIGNUP_WIZARD_STEPS, trackClientEvent } from "@/lib/events";
import type { SignUpFieldValues } from "@/lib/validations/auth";

import type { SignUpFormApi } from "./types";

const STEP = SIGNUP_WIZARD_STEPS[1];
const FIELDS = ["location", "interestedInCommenting"] as const;

export function StepLocationInterest({
  form,
  onAdvance,
  onBack,
}: {
  form: SignUpFormApi;
  onAdvance: () => void;
  onBack: () => void;
}) {
  const { register, trigger, getFieldState, formState } = form;
  const { errors } = formState;

  useEffect(() => {
    trackClientEvent({ name: "signup_step_viewed", properties: STEP });
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await trigger([...FIELDS] as FieldPath<SignUpFieldValues>[], {
      shouldFocus: true,
    });
    if (ok) {
      trackClientEvent({ name: "signup_step_completed", properties: STEP });
      onAdvance();
      return;
    }
    const fields = FIELDS.filter(
      (n) => getFieldState(n, formState).invalid,
    ) as string[];
    trackClientEvent({
      name: "signup_validation_error",
      properties: { ...STEP, fields },
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="sign-up-location">Location (optional)</Label>
        <Input
          id="sign-up-location"
          type="text"
          autoComplete="off"
          aria-invalid={errors.location ? true : undefined}
          aria-describedby={
            errors.location ? "sign-up-location-error" : undefined
          }
          {...register("location")}
        />
        {errors.location && (
          <p id="sign-up-location-error" className="text-xs text-destructive">
            {String(errors.location.message)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id="sign-up-commenting"
          className="size-4 rounded border border-foreground/20"
          type="checkbox"
          {...register("interestedInCommenting")}
        />
        <Label className="font-normal" htmlFor="sign-up-commenting">
          Interested in commenting on photos
        </Label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          className="order-2 sm:order-1"
          type="button"
          variant="outline"
          onClick={onBack}
          data-analytics={`signup_wizard:${STEP.step_key}:back`}
          aria-describedby="sign-up-back-hint-2"
        >
          Back
        </Button>
        <span id="sign-up-back-hint-2" className="sr-only">
          Return to account details step
        </span>
        <Button
          className="order-1 sm:order-2 sm:min-w-[7rem]"
          type="submit"
          data-analytics={`signup_wizard:${STEP.step_key}:next`}
          aria-describedby="sign-up-next-hint-2"
        >
          Next
        </Button>
        <span id="sign-up-next-hint-2" className="sr-only">
          Continue to review step
        </span>
      </div>
    </form>
  );
}
