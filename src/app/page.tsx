import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Track sign-ups and referrals with first-party analytics",
  description:
    "User Tracker is a lightweight tool to onboard users, reward referrals, and measure acquisition without third-party cookies.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-24 sm:py-32"
    >
      <section aria-labelledby="hero-heading" className="flex flex-col gap-6">
        <h1
          id="hero-heading"
          className="font-heading text-3xl font-medium tracking-tight sm:text-4xl"
        >
          Track sign-ups and referrals without third-party cookies.
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Lightweight, privacy-first analytics for product teams who want to
          understand onboarding and reward referrals.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/sign-up">Create an account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
