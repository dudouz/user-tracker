"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

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
import { useSignInMutation } from "@/hooks/auth-mutations";
import { trackClientEvent, type AbandonReason } from "@/lib/events";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";

type SignInFormProps = {
  callbackUrl?: string;
};

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const signIn = useSignInMutation(setError, callbackUrl);

  const abandonReportedRef = useRef(false);
  const startedAtRef = useRef<number>(0);
  const submitStateRef = useRef({ isPending: false, isSuccess: false });

  useEffect(() => {
    submitStateRef.current.isPending = signIn.isPending;
    submitStateRef.current.isSuccess = signIn.isSuccess;
  }, [signIn.isPending, signIn.isSuccess]);

  useEffect(() => {
    startedAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    function reportAbandon(reason: AbandonReason) {
      if (abandonReportedRef.current) return;
      if (submitStateRef.current.isPending || submitStateRef.current.isSuccess) return;
      abandonReportedRef.current = true;
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      trackClientEvent({
        name: "sign_in_abandoned",
        properties: {
          reason,
          time_on_page_ms: Math.max(
            0,
            Math.round(now - startedAtRef.current),
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

  const pending = isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Sign in</CardTitle>
        <CardDescription>
          Use your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (data) => {
            await signIn.mutateAsync(data);
          })}
          noValidate
        >
          {errors.root?.message && (
            <p className="text-xs text-destructive" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="sign-in-email">Email</Label>
            <Input
              id="sign-in-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "sign-in-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="sign-in-email-error" className="text-xs text-destructive">
                {String(errors.email.message)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-in-password">Password</Label>
            <Input
              id="sign-in-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? "sign-in-password-error" : undefined
              }
              {...register("password")}
            />
            {errors.password && (
              <p
                id="sign-in-password-error"
                className="text-xs text-destructive"
              >
                {String(errors.password.message)}
              </p>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <span aria-hidden>Signing in…</span>
                <span className="sr-only">Signing in, please wait</span>
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-muted-foreground">
        <p className="text-xs/relaxed">
          No account?{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href="/sign-up"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
