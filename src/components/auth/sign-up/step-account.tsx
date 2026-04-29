"use client";

import { useEffect } from "react";
import type { FieldPath } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIGNUP_WIZARD_STEPS, trackClientEvent } from "@/lib/events";
import type { SignUpFieldValues } from "@/lib/validations/auth";

import type { SignUpFormApi } from "./types";

const STEP = SIGNUP_WIZARD_STEPS[0];
const FIELDS = ["name", "email", "password", "referrerCode"] as const;

export function StepAccount({
  form,
  onAdvance,
}: {
  form: SignUpFormApi;
  onAdvance: () => void;
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
        <Label htmlFor="sign-up-name">Name</Label>
        <Input
          id="sign-up-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "sign-up-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="sign-up-name-error" className="text-xs text-destructive">
            {String(errors.name.message)}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sign-up-email">Email</Label>
        <Input
          id="sign-up-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "sign-up-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="sign-up-email-error" className="text-xs text-destructive">
            {String(errors.email.message)}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sign-up-password">Password</Label>
        <Input
          id="sign-up-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "sign-up-password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="sign-up-password-error" className="text-xs text-destructive">
            {String(errors.password.message)}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sign-up-referrer">
          Invite code{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="sign-up-referrer"
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="16-character code from a friend"
          className="font-mono"
          maxLength={16}
          aria-invalid={errors.referrerCode ? true : undefined}
          aria-describedby={
            errors.referrerCode ? "sign-up-referrer-error" : undefined
          }
          {...register("referrerCode")}
        />
        {errors.referrerCode && (
          <p
            id="sign-up-referrer-error"
            className="text-xs text-destructive"
          >
            {String(errors.referrerCode.message)}
          </p>
        )}
      </div>
      <Button
        className="w-full"
        type="submit"
        data-analytics={`signup_wizard:${STEP.step_key}:next`}
        aria-describedby="sign-up-next-hint-1"
      >
        Next
      </Button>
      <span id="sign-up-next-hint-1" className="sr-only">
        Continue to location and interest step
      </span>
    </form>
  );
}
