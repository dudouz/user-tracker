"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  AuthRequestError,
  postSignIn,
  postSignOut,
  postSignUp,
} from "@/lib/api/auth-client";
import { authKeys } from "@/lib/api/auth-queries";
import {
  postInsightsConnect,
  type ConnectInsightsResponse,
} from "@/lib/api/insights-client";
import {
  InviteRequestError,
  postInviteSendEmail,
} from "@/lib/api/invite-client";
import { trackClientEvent, type SignInFailureCode } from "@/lib/events";
import { identifyPostHogUser } from "@/lib/posthog/identify-user";
import { getSafeCallbackUrl } from "@/lib/safe-callback";
import type {
  InviteSendInput,
  SignInInput,
  SignUpFieldValues,
  SignUpInput,
} from "@/lib/validations/auth";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function useInvalidateMeAndRefresh() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    router.refresh();
  };
}

function applyAuthRequestFormError<T extends SignInInput | SignUpFieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  messageFallback: string,
) {
  if (error instanceof AuthRequestError) {
    if (error.status === 400 && error.body.error) {
      setError("root", { message: String(error.body.error) });
    }
    toast.error(error.message || messageFallback);
  }
}

function classifySignInFailure(error: unknown): SignInFailureCode {
  if (error instanceof AuthRequestError) {
    if (error.status === 401 || error.status === 400) return "invalid_credentials";
    if (error.status === 429) return "rate_limited";
    return "unknown";
  }
  // fetch() throws TypeError on network-level failures
  if (error instanceof TypeError) return "network";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function useSignInMutation(setError: UseFormSetError<SignInInput>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invalidate = useInvalidateMeAndRefresh();
  return useMutation({
    mutationFn: (input: SignInInput) => postSignIn(input),
    onSuccess: (data) => {
      identifyPostHogUser(data.user.id);
      trackClientEvent({
        name: "sign_in_completed",
        properties: { method: "password" },
      });
      invalidate();
      const next = getSafeCallbackUrl(
        searchParams.get("callbackUrl"),
        "/dashboard",
      );
      router.push(next);
    },
    onError: (error) => {
      trackClientEvent({
        name: "sign_in_failed",
        properties: { code: classifySignInFailure(error) },
      });
      applyAuthRequestFormError(error, setError, "Sign in failed");
    },
  });
}

export function useSignUpMutation(setError: UseFormSetError<SignUpFieldValues>) {
  const router = useRouter();
  const invalidate = useInvalidateMeAndRefresh();
  return useMutation({
    mutationFn: (input: SignUpInput) => postSignUp(input),
    onSuccess: (data) => {
      identifyPostHogUser(data.user.id);
      invalidate();
      router.push("/dashboard");
    },
    onError: (error) => {
      applyAuthRequestFormError(error, setError, "Sign up failed");
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: postSignOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      router.push("/");
      router.refresh();
    },
    onError: () => {
      toast.error("Could not sign out");
    },
  });
}

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export function useSendInviteEmailMutation() {
  return useMutation({
    mutationFn: (input: InviteSendInput) => postInviteSendEmail(input),
    onSuccess: () => {
      toast.success("Invite sent");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof InviteRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to send";
      toast.error(message);
    },
  });
}

// ---------------------------------------------------------------------------
// Insights / Arcade gateway
// ---------------------------------------------------------------------------

export function useInsightsConnectMutation() {
  return useMutation<ConnectInsightsResponse>({
    mutationFn: postInsightsConnect,
  });
}
