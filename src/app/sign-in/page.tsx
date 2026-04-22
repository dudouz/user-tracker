import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your User Tracker account.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16"
    >
      <Suspense
        fallback={
          <p
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            Loading sign-in…
          </p>
        }
      >
        <SignInForm />
      </Suspense>
    </main>
  );
}
