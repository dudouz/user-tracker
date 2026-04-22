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
import { getSafeCallbackUrl } from "@/lib/safe-callback";
import type { SignInInput, SignUpInput } from "@/lib/validations/auth";

function useInvalidateMeAndRefresh() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    router.refresh();
  };
}

function applyAuthRequestFormError<T extends SignInInput | SignUpInput>(
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

export function useSignInMutation(setError: UseFormSetError<SignInInput>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invalidate = useInvalidateMeAndRefresh();
  return useMutation({
    mutationFn: (input: SignInInput) => postSignIn(input),
    onSuccess: () => {
      invalidate();
      const next = getSafeCallbackUrl(
        searchParams.get("callbackUrl"),
        "/dashboard",
      );
      router.push(next);
    },
    onError: (error) => {
      applyAuthRequestFormError(error, setError, "Sign in failed");
    },
  });
}

export function useSignUpMutation(setError: UseFormSetError<SignUpInput>) {
  const router = useRouter();
  const invalidate = useInvalidateMeAndRefresh();
  return useMutation({
    mutationFn: (input: SignUpInput) => postSignUp(input),
    onSuccess: () => {
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
