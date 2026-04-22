import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InsightsChat } from "@/components/insights/insights-chat";
import { AUTH_SIGN_IN_PATH } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Ask questions about sign-ups, referrals, and product analytics via PostHog.",
};

export default async function InsightsPage() {
  const session = await getSession();
  if (!session) {
    redirect(AUTH_SIGN_IN_PATH);
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6"
    >
      <header className="space-y-1">
        <h1 className="font-heading text-lg font-medium">Insights</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          Ask about sign-ups, referrals, funnels, retention — powered by PostHog
          through the Arcade MCP Gateway.
        </p>
      </header>
      <InsightsChat />
    </main>
  );
}
