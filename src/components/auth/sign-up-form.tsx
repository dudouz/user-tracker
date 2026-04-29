"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSignUpMutation } from "@/hooks/auth-mutations";
import {
  SIGNUP_STEP_TOTAL,
  SIGNUP_WIZARD_STEPS,
  trackClientEvent,
  type SignupWizardStep,
  type SignupWizardStepKey,
} from "@/lib/events";
import { cn } from "@/lib/utils";
import {
  signUpSchema,
  type SignUpFieldValues,
  type SignUpInput,
} from "@/lib/validations/auth";

import { StepAccount } from "./sign-up/step-account";
import { StepConfirm } from "./sign-up/step-confirm";
import { StepLocationInterest } from "./sign-up/step-location-interest";
import { useSignUpAbandonTracking } from "./sign-up/use-abandon-tracking";

const REF_OPENED_KEY = "analytics:referral_link_opened";

const STEP_HEADINGS: Record<
  SignupWizardStepKey,
  { title: string; description: string }
> = {
  account: {
    title: "Name & password",
    description: "Your name, email, and a secure password.",
  },
  location_interest: {
    title: "Location & interest",
    description:
      "Optional location and whether you are interested in commenting on photos.",
  },
  confirm: {
    title: "Confirm",
    description: "Review your details, then create your account.",
  },
};

function parseRefParam(raw: string | null): string {
  if (!raw) return "";
  const t = raw.trim();
  if (t.length === 16 && /^[a-f0-9A-F]+$/i.test(t)) {
    return t.toLowerCase();
  }
  return "";
}

export function SignUpForm() {
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState<SignupWizardStep>(
    SIGNUP_WIZARD_STEPS[0],
  );
  const activeStepNumber = SIGNUP_WIZARD_STEPS.indexOf(activeStep) + 1;
  const refFromQuery = useMemo(
    () => parseRefParam(searchParams.get("ref")),
    [searchParams],
  );

  const form = useForm<SignUpFieldValues, unknown, SignUpInput>({
    resolver: zodResolver(signUpSchema) as Resolver<
      SignUpFieldValues,
      unknown,
      SignUpInput
    >,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      location: "",
      interestedInCommenting: false,
      referrerCode: "",
    },
  });
  const { setError, setValue } = form;

  useEffect(() => {
    if (refFromQuery) {
      setValue("referrerCode", refFromQuery, { shouldValidate: false });
    }
  }, [refFromQuery, setValue]);

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

  useSignUpAbandonTracking({
    step: activeStep,
    isSettling: signUp.isPending || signUp.isSuccess,
  });

  function goNext() {
    setActiveStep((current) => {
      const next = SIGNUP_WIZARD_STEPS[SIGNUP_WIZARD_STEPS.indexOf(current) + 1];
      return next ?? current;
    });
  }
  function goBack() {
    setActiveStep((current) => {
      const prev = SIGNUP_WIZARD_STEPS[SIGNUP_WIZARD_STEPS.indexOf(current) - 1];
      return prev ?? current;
    });
  }

  const heading = STEP_HEADINGS[activeStep.step_key];

  return (
    <Card>
      <CardHeader>
        <p
          id="signup-step-label"
          className="text-xs/relaxed text-muted-foreground"
          aria-live="polite"
        >
          Step {activeStepNumber} of {SIGNUP_STEP_TOTAL}
        </p>
        <CardTitle as="h1">{heading.title}</CardTitle>
        <CardDescription>{heading.description}</CardDescription>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={SIGNUP_STEP_TOTAL}
          aria-valuenow={activeStepNumber}
          aria-labelledby="signup-step-label"
          className="mt-3 flex gap-1.5"
        >
          {SIGNUP_WIZARD_STEPS.map((s, i) => (
            <span
              key={s.step_key}
              aria-hidden
              className={cn(
                "h-1.5 min-w-6 flex-1 rounded-sm",
                i < activeStepNumber ? "bg-foreground/80" : "bg-foreground/15",
              )}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {activeStep.step_key === "account" && (
          <StepAccount form={form} onAdvance={goNext} />
        )}
        {activeStep.step_key === "location_interest" && (
          <StepLocationInterest
            form={form}
            onAdvance={goNext}
            onBack={goBack}
          />
        )}
        {activeStep.step_key === "confirm" && (
          <StepConfirm
            form={form}
            onBack={goBack}
            onSubmit={(data) => signUp.mutateAsync(data).then(() => undefined)}
            isPending={signUp.isPending}
          />
        )}
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
