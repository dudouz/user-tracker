import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a User Tracker account.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
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
            Loading sign up…
          </p>
        }
      >
        <SignUpForm />
      </Suspense>
    </main>
  );
}
