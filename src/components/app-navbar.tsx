import Link from "next/link";

const navLinkClass =
  "text-xs/relaxed text-muted-foreground transition-colors hover:text-foreground";

const routes = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invite", label: "Invite" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/sign-up", label: "Sign up" },
] as const;

export function AppNavbar() {
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
            {routes.map((item) => (
              <li key={item.href}>
                <Link className={navLinkClass} href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
