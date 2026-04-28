import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a User Tracker account.",
  alternates: { canonical: "/sign-up" },
};

type SignUpPageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseRefParam(raw: string | undefined): string {
  if (!raw) return "";
  const t = raw.trim();
  if (t.length === 16 && /^[a-f0-9A-F]+$/i.test(t)) {
    return t.toLowerCase();
  }
  return "";
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  // Read query params from the server side
  const referrerCode = parseRefParam(firstParam((await searchParams).ref));

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16"
    >
      <SignUpForm initialReferrerCode={referrerCode} />
    </main>
  );
}
