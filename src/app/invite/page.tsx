import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InviteFriendsPanel } from "@/components/invite/invite-friends-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppBaseUrl } from "@/lib/app-url";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Invite friends",
  description: "Share your User Tracker invite link or code.",
};

export default async function InvitePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/invite");
  }

  const [row] = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!row) {
    redirect("/sign-in?callbackUrl=/invite");
  }

  const baseUrl = getAppBaseUrl();

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16"
    >
      <Card>
        <CardHeader>
          <CardTitle as="h1">Invite friends</CardTitle>
          <CardDescription>
            Share the link or code so others can sign up with your referral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteFriendsPanel
            baseUrl={baseUrl}
            referralCode={row.referralCode}
          />
        </CardContent>
        <CardFooter>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
