import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { AppNavbar } from "@/components/app-navbar";
import { AppPostHogProvider } from "@/components/providers/posthog-provider";
import { PostHogUserSync } from "@/components/providers/posthog-user-sync";
import { QueryProvider } from "@/components/providers/query-provider";
import { getAppBaseUrl } from "@/lib/app-url";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "User Tracker — Track sign-ups and referrals",
    template: "%s · User Tracker",
  },
  description:
    "User Tracker helps teams onboard users, manage referrals, and understand sign-up behaviour with first-party analytics.",
  applicationName: "User Tracker",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "User Tracker",
    url: "/",
    title: "User Tracker — Track sign-ups and referrals",
    description:
      "Onboard users, manage referrals, and analyse sign-up behaviour with first-party analytics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "User Tracker",
    description:
      "Onboard users, manage referrals, and analyse sign-up behaviour.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const user = session ? { id: session.userId, email: session.email } : null;

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-mono",
        jetbrainsMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <AppPostHogProvider>
          <QueryProvider>
            <PostHogUserSync userId={user?.id ?? null} />
            <AppNavbar user={user} />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </QueryProvider>
        </AppPostHogProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
