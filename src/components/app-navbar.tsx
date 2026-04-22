import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

const navLinkClass =
  "text-xs/relaxed text-muted-foreground transition-colors hover:text-foreground";

export interface AppNavbarUser {
  id: string;
  email: string;
}

interface AppNavbarProps {
  user: AppNavbarUser | null;
}

export function AppNavbar({ user }: AppNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          className="font-heading text-sm font-medium text-foreground"
          href="/"
        >
          User Tracker
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-x-6">
            {user && (
              <>
                <li>
                  <Link className={navLinkClass} href="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link className={navLinkClass} href="/invite">
                    Invite
                  </Link>
                </li>
                <li>
                  <span
                    className="max-w-[10rem] truncate text-xs/relaxed text-muted-foreground"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </li>
                <li>
                  <SignOutButton />
                </li>
              </>
            )}
            {!user && (
              <li>
                <Link className={navLinkClass} href="/sign-in">
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
