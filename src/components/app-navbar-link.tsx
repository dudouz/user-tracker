"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppNavbarLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function AppNavbarLink({ href, label, className }: AppNavbarLinkProps) {
  const pathname = usePathname();
  const isCurrent = pathname === href;

  return (
    <Link
      href={href}
      className={className}
      aria-current={isCurrent ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
