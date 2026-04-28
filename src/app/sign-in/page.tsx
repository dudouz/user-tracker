import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your User Tracker account.",
  alternates: { canonical: "/sign-in" },
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl = firstParam((await searchParams).callbackUrl);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16"
    >
      <SignInForm callbackUrl={callbackUrl} />
    </main>
  );
}
