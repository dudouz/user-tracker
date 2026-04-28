"use client";

import { useEffect } from "react";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { SIGNUP_WIZARD_STEPS, trackClientEvent } from "@/lib/events";
import type { SignUpInput } from "@/lib/validations/auth";

import type { SignUpFormApi } from "./types";

const STEP = SIGNUP_WIZARD_STEPS[2];

export function StepConfirm({
  form,
  onBack,
  onSubmit,
  isPending,
}: {
  form: SignUpFormApi;
  onBack: () => void;
  onSubmit: (data: SignUpInput) => Promise<void>;
  isPending: boolean;
}) {
  const { control, handleSubmit, formState } = form;
  const { errors } = formState;
  const watched = useWatch({ control });
  const hasReferrerPreview =
    typeof watched.referrerCode === "string" && watched.referrerCode.length > 0;

  useEffect(() => {
    trackClientEvent({ name: "signup_step_viewed", properties: STEP });
  }, []);

  const onFormSubmit = handleSubmit(
    async (data) => {
      await onSubmit(data);
    },
    (formErrors) => {
      const fields = Object.keys(formErrors) as string[];
      trackClientEvent({
        name: "signup_validation_error",
        properties: { ...STEP, fields },
      });
    },
  );

  return (
    <form className="space-y-4" onSubmit={onFormSubmit} noValidate>
      {errors.root?.message && (
        <p className="text-xs text-destructive" role="alert">
          {errors.root.message}
        </p>
      )}
      <dl className="space-y-3 rounded-md border border-foreground/10 p-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Name</dt>
          <dd className="text-foreground">{watched.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Email</dt>
          <dd className="break-all text-foreground">{watched.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Password</dt>
          <dd className="text-foreground">••••••••</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Location</dt>
          <dd className="text-foreground">
            {watched.location?.trim() || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            Commenting on photos
          </dt>
          <dd className="text-foreground">
            {watched.interestedInCommenting ? "Yes" : "No"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Invite code</dt>
          <dd className="font-mono text-foreground break-all">
            {hasReferrerPreview ? watched.referrerCode : "—"}
          </dd>
        </div>
      </dl>
      {errors.referrerCode && (
        <p className="text-xs text-destructive" role="alert">
          {String(errors.referrerCode.message)}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          className="order-2 sm:order-1"
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          data-analytics={`signup_wizard:${STEP.step_key}:back`}
          aria-describedby="sign-up-back-hint-3"
        >
          Back
        </Button>
        <span id="sign-up-back-hint-3" className="sr-only">
          Return to location and interest step
        </span>
        <Button
          className="order-1 sm:order-2 sm:min-w-[7rem]"
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          data-analytics={`signup_wizard:${STEP.step_key}:submit`}
        >
          {isPending ? (
            <>
              <span aria-hidden>Creating account…</span>
              <span className="sr-only">
                Creating your account, please wait
              </span>
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </div>
    </form>
  );
}
