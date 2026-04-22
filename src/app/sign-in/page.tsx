import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-sm text-muted-foreground">
          Loading sign-in…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
