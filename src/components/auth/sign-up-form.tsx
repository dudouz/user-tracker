"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldPath, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUpMutation } from "@/hooks/auth-mutations";
import { getSignupWizardStepMeta } from "@/lib/events/signup-wizard";
import { trackClientEvent } from "@/lib/events/track-client";
import type {
  SignupStep,
  SignupWizardAdvanceStepKey,
  SignupWizardStepContext,
} from "@/lib/events/types";
import { signUpSchema, type SignUpFieldValues, type SignUpInput } from "@/lib/validations/auth";

const REF_OPENED_KEY = "analytics:referral_link_opened";

const STEP_FIELDS = {
  1: ["name", "email", "password", "referrerCode"] as const,
  2: ["location", "interestedInCommenting"] as const,
} satisfies Record<number, ReadonlyArray<keyof SignUpFieldValues>>;

function parseRefParam(raw: string | null): string {
  if (!raw) return "";
  const t = raw.trim();
  if (t.length === 16 && /^[a-f0-9A-F]+$/i.test(t)) {
    return t.toLowerCase();
  }
  return "";
}

function wizardStepContext(n: SignupStep): SignupWizardStepContext {
  const m = getSignupWizardStepMeta(n);
  return { step_key: m.key, step_label: m.label };
}

export function SignUpForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const refFromQuery = useMemo(
    () => parseRefParam(searchParams.get("ref")),
    [searchParams],
  );

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    trigger,
    getFieldState,
    formState,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFieldValues, unknown, SignUpInput>({
    resolver: zodResolver(signUpSchema) as Resolver<SignUpFieldValues, unknown, SignUpInput>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      location: "",
      interestedInCommenting: false,
      referrerCode: "",
    },
  });
  const watched = useWatch({ control });

  useEffect(() => {
    if (refFromQuery) {
      setValue("referrerCode", refFromQuery, { shouldValidate: false });
    }
  }, [refFromQuery, setValue]);

  useEffect(() => {
    trackClientEvent({
      name: "signup_step_viewed",
      properties: wizardStepContext(step as SignupStep),
    });
  }, [step]);

  useEffect(() => {
    if (!refFromQuery || typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(REF_OPENED_KEY) === "1") return;
    sessionStorage.setItem(REF_OPENED_KEY, "1");
    trackClientEvent({
      name: "referral_link_opened",
      properties: { ref_present: true },
    });
  }, [refFromQuery]);

  const signUp = useSignUpMutation(setError);

  async function goNext() {
    const names = STEP_FIELDS[step as 1 | 2];
    if (!names) return;
    const currentStep = step as SignupStep;
    const ok = await trigger([...names] as FieldPath<SignUpFieldValues>[], {
      shouldFocus: true,
    });
    if (ok) {
      const completed = wizardStepContext(currentStep);
      trackClientEvent({
        name: "signup_step_completed",
        properties: {
          step_key: completed.step_key as SignupWizardAdvanceStepKey,
          step_label: completed.step_label,
        },
      });
      setStep((s) => Math.min(3, s + 1));
      return;
    }
    const fields = names.filter((n) =>
      getFieldState(n, formState).invalid,
    ) as string[];
    trackClientEvent({
      name: "signup_validation_error",
      properties: { ...wizardStepContext(currentStep), fields },
    });
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  const onSubmit = handleSubmit(
    async (data) => {
      if (step === 1 || step === 2) {
        await goNext();
        return;
      }
      await signUp.mutateAsync(data);
    },
    (formErrors) => {
      if (step === 3) {
        const fields = Object.keys(formErrors) as string[];
        trackClientEvent({
          name: "signup_validation_error",
          properties: { ...wizardStepContext(3), fields },
        });
      }
    },
  );

  const pending = isSubmitting;
  const hasReferrerPreview =
    typeof watched.referrerCode === "string" && watched.referrerCode.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <p className="text-xs/relaxed text-muted-foreground">
            Step {step} of 3
          </p>
          {step === 1 && (
            <>
              <CardTitle>Name & password</CardTitle>
              <CardDescription>
                Your name, email, and a secure password.
              </CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle>Location & interest</CardTitle>
              <CardDescription>
                Optional location and whether you are interested in commenting
                on photos.
              </CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle>Confirm</CardTitle>
              <CardDescription>
                Review your details, then create your account.
              </CardDescription>
            </>
          )}
          <ol className="mt-3 flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((n) => (
              <li
                key={n}
                className={
                  n <= step
                    ? "h-1.5 min-w-6 flex-1 rounded-sm bg-foreground/80"
                    : "h-1.5 min-w-6 flex-1 rounded-sm bg-foreground/15"
                }
              />
            ))}
          </ol>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            {errors.root?.message && (
              <p className="text-xs text-destructive" role="alert">
                {errors.root.message}
              </p>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sign-up-name">Name</Label>
                  <Input
                    id="sign-up-name"
                    type="text"
                    autoComplete="name"
                    aria-invalid={errors.name ? true : undefined}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
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
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
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
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {String(errors.password.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-up-referrer">
                    Invite code <span className="text-muted-foreground">(optional)</span>
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
                    {...register("referrerCode")}
                  />
                  {errors.referrerCode && (
                    <p className="text-xs text-destructive">
                      {String(errors.referrerCode.message)}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  type="button"
                  onClick={() => {
                    void goNext();
                  }}
                  data-analytics="signup_wizard:account:next"
                  aria-label="Sign up wizard: go to location step"
                >
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sign-up-location">Location (optional)</Label>
                  <Input
                    id="sign-up-location"
                    type="text"
                    autoComplete="off"
                    aria-invalid={errors.location ? true : undefined}
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="text-xs text-destructive">
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
                    onClick={goBack}
                    data-analytics="signup_wizard:location_interest:back"
                    aria-label="Sign up wizard: back to account step"
                  >
                    Back
                  </Button>
                  <Button
                    className="order-1 sm:order-2 sm:min-w-[7rem]"
                    type="button"
                    onClick={() => {
                      void goNext();
                    }}
                    data-analytics="signup_wizard:location_interest:next"
                    aria-label="Sign up wizard: go to review step"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <dl className="space-y-3 rounded-md border border-foreground/10 p-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="text-foreground">{watched.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd className="break-all text-foreground">
                      {watched.email || "—"}
                    </dd>
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
                {errors.referrerCode && step === 3 && (
                  <p className="text-xs text-destructive" role="alert">
                    {String(errors.referrerCode.message)}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    className="order-2 sm:order-1"
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={pending}
                    data-analytics="signup_wizard:confirm:back"
                    aria-label="Sign up wizard: back to location step"
                  >
                    Back
                  </Button>
                  <Button
                    className="order-1 sm:order-2 sm:min-w-[7rem]"
                    type="submit"
                    disabled={pending}
                    data-analytics="signup_wizard:confirm:submit"
                    aria-label="Sign up wizard: create account"
                  >
                    {pending ? "Creating account…" : "Create account"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
        <CardFooter className="text-muted-foreground">
          <p className="text-xs/relaxed">
            Already have an account?{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
