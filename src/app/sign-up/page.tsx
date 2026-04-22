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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="sign-up-email">Email</Label>
              <Input
                id="sign-up-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sign-up-password">Password</Label>
              <Input
                id="sign-up-password"
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </div>
            <Button className="w-full" type="button">
              Create account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-muted-foreground">
          <p className="text-xs/relaxed">
            Already have an account?{" "}
            <Link className="text-foreground underline underline-offset-4" href="/sign-in">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
