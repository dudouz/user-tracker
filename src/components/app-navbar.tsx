import Link from "next/link";

import { AppNavbarLink } from "@/components/app-navbar-link";
import { AuthMenu } from "@/components/auth/auth-menu";

const navLinkClass =
  "text-xs/relaxed text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground";

export interface AppNavbarUser {
  id: string;
  email: string;
}

interface AppNavbarProps {
  user: AppNavbarUser | null;
}

interface NavItem {
  href: string;
  label: string;
}

const AUTHED_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/insights", label: "Insights" },
  { href: "/invite", label: "Invite" },
];

const ANON_NAV_ITEMS: NavItem[] = [{ href: "/sign-in", label: "Sign in" }];

export function AppNavbar({ user }: AppNavbarProps) {
  const navItems = user ? AUTHED_NAV_ITEMS : ANON_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          className="font-heading text-sm font-medium text-foreground"
          href="/"
          aria-label="User Tracker, go to home"
        >
          User Tracker
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-x-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <AppNavbarLink
                  href={item.href}
                  label={item.label}
                  className={navLinkClass}
                />
              </li>
            ))}
          </ul>
        </nav>
        {user && <AuthMenu initialUser={user} />}
      </div>
    </header>
  );
}
