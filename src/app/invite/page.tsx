import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Invite",
  description: "Accept an invitation to join a workspace or team",
};

interface InvitePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const resolved = await searchParams;
  const token =
    typeof resolved.token === "string"
      ? resolved.token
      : Array.isArray(resolved.token)
        ? resolved.token[0]
        : undefined;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Invitation</CardTitle>
          <CardDescription>
            Review the invitation and accept to join. Pass a query such as{" "}
            <code className="rounded-none bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
              ?token=
            </code>{" "}
            when you wire this up to your backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs/relaxed text-muted-foreground">
          {token ? (
            <p>
              <span className="text-foreground">Token (preview):</span> {token}
            </p>
          ) : (
            <p>No token in the URL yet.</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button">Accept invitation</Button>
          <Link
            className="text-xs text-foreground underline underline-offset-4"
            href="/sign-in"
          >
            Sign in instead
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
