"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useAuthUser } from "@/hooks/use-auth-user";

export interface AuthMenuInitialUser {
  id: string;
  email: string;
}

interface AuthMenuProps {
  initialUser: AuthMenuInitialUser;
}

export function AuthMenu({ initialUser }: AuthMenuProps) {
  const { data } = useAuthUser({ user: initialUser });
  const user = data?.user ?? null;

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <span
        className="max-w-[10rem] truncate text-xs/relaxed text-muted-foreground"
        aria-label={`Signed in as ${user.email}`}
      >
        {user.email}
      </span>
      <SignOutButton />
    </div>
  );
}
