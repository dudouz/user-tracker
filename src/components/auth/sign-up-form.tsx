"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useSignUpMutation } from "@/hooks/mutations";
import {
  getSignupWizardStepMeta,
  trackClientEvent,
  type AbandonReason,
  type SignupStep,
  type SignupWizardAdvanceStepKey,
  type SignupWizardStepContext,
} from "@/lib/events";
import { cn } from "@/lib/utils";
import { signUpSchema, type SignUpFieldValues, type SignUpInput } from "@/lib/validations/auth";

const REF_OPENED_KEY = "analytics:referral_link_opened";

const STEP_FIELDS = {
  1: ["name", "email", "password", "referrerCode"] as const,
  2: ["location", "interestedInCommenting"] as const,
} satisfies Record<number, ReadonlyArray<keyof SignUpFieldValues>>;

const STEP_TOTAL = 3;

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

  const stepRef = useRef<SignupStep>(1);
  const stepStartedAtRef = useRef<number>(0);
  const abandonReportedRef = useRef(false);
  const submitStateRef = useRef({ isPending: false, isSuccess: false });

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

  useEffect(() => {
    stepRef.current = step as SignupStep;
    stepStartedAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    trackClientEvent({
      name: "signup_step_viewed",
      properties: wizardStepContext(step as SignupStep),
    });
  }, [step]);

  useEffect(() => {
    submitStateRef.current.isPending = signUp.isPending;
    submitStateRef.current.isSuccess = signUp.isSuccess;
  }, [signUp.isPending, signUp.isSuccess]);

  useEffect(() => {
    function reportAbandon(reason: AbandonReason) {
      if (abandonReportedRef.current) return;
      if (submitStateRef.current.isPending || submitStateRef.current.isSuccess) return;
      abandonReportedRef.current = true;
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      trackClientEvent({
        name: "signup_wizard_abandoned",
        properties: {
          ...wizardStepContext(stepRef.current),
          reason,
          time_on_step_ms: Math.max(
            0,
            Math.round(now - stepStartedAtRef.current),
          ),
        },
      });
    }
    function onPageHide() {
      reportAbandon("tab_closed");
    }
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      reportAbandon("navigated_away");
    };
  }, []);

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
      setStep((s) => Math.min(STEP_TOTAL, s + 1));
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
    <Card>
      <CardHeader>
        <p
          id="signup-step-label"
          className="text-xs/relaxed text-muted-foreground"
          aria-live="polite"
        >
          Step {step} of {STEP_TOTAL}
        </p>
        {step === 1 && (
          <>
            <CardTitle as="h1">Name &amp; password</CardTitle>
            <CardDescription>
              Your name, email, and a secure password.
            </CardDescription>
          </>
        )}
        {step === 2 && (
          <>
            <CardTitle as="h1">Location &amp; interest</CardTitle>
            <CardDescription>
              Optional location and whether you are interested in commenting on
              photos.
            </CardDescription>
          </>
        )}
        {step === 3 && (
          <>
            <CardTitle as="h1">Confirm</CardTitle>
            <CardDescription>
              Review your details, then create your account.
            </CardDescription>
          </>
        )}
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_TOTAL}
          aria-valuenow={step}
          aria-labelledby="signup-step-label"
          className="mt-3 flex gap-1.5"
        >
          {Array.from({ length: STEP_TOTAL }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              aria-hidden
              className={cn(
                "h-1.5 min-w-6 flex-1 rounded-sm",
                n <= step ? "bg-foreground/80" : "bg-foreground/15",
              )}
            />
          ))}
        </div>
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
                  aria-describedby={
                    errors.name ? "sign-up-name-error" : undefined
                  }
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
                  aria-describedby={
                    errors.email ? "sign-up-email-error" : undefined
                  }
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
                  aria-describedby={
                    errors.password ? "sign-up-password-error" : undefined
                  }
                  {...register("password")}
                />
                {errors.password && (
                  <p
                    id="sign-up-password-error"
                    className="text-xs text-destructive"
                  >
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
                type="button"
                onClick={() => {
                  void goNext();
                }}
                data-analytics="signup_wizard:account:next"
                aria-describedby="sign-up-next-hint-1"
              >
                Next
              </Button>
              <span id="sign-up-next-hint-1" className="sr-only">
                Continue to location and interest step
              </span>
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
                  aria-describedby={
                    errors.location ? "sign-up-location-error" : undefined
                  }
                  {...register("location")}
                />
                {errors.location && (
                  <p
                    id="sign-up-location-error"
                    className="text-xs text-destructive"
                  >
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
                  aria-describedby="sign-up-back-hint-2"
                >
                  Back
                </Button>
                <span id="sign-up-back-hint-2" className="sr-only">
                  Return to account details step
                </span>
                <Button
                  className="order-1 sm:order-2 sm:min-w-[7rem]"
                  type="button"
                  onClick={() => {
                    void goNext();
                  }}
                  data-analytics="signup_wizard:location_interest:next"
                  aria-describedby="sign-up-next-hint-2"
                >
                  Next
                </Button>
                <span id="sign-up-next-hint-2" className="sr-only">
                  Continue to review step
                </span>
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
                  disabled={pending}
                  aria-busy={pending}
                  data-analytics="signup_wizard:confirm:submit"
                >
                  {pending ? (
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
  );
}
