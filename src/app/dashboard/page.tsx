import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Application dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-medium">Dashboard</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          Overview and key metrics for your workspace.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Replace this with charts, tables, and widgets as you build out the
            app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs/relaxed text-muted-foreground">
            <Link className="text-foreground underline underline-offset-4" href="/">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
