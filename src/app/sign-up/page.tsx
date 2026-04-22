import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-sm text-muted-foreground">
          Loading sign up…
        </main>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
