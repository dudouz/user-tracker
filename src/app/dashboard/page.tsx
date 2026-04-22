import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTH_SIGN_IN_PATH } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your User Tracker workspace overview.",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect(AUTH_SIGN_IN_PATH);
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6"
    >
      <header className="space-y-1">
        <h1 className="font-heading text-lg font-medium">Dashboard</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          Signed in as <span className="text-foreground">{session.email}</span>
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle as="h2">Welcome</CardTitle>
          <CardDescription>
            Your workspace overview. Build charts and widgets here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs/relaxed text-muted-foreground">
            <Link
              className="text-foreground underline underline-offset-4"
              href="/"
            >
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
