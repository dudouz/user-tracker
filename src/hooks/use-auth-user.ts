"use client";

import { useQuery } from "@tanstack/react-query";

import { type MeResponse } from "@/lib/api/auth-client";
import { getMe, authKeys } from "@/lib/api/auth-queries";

/**
 * @param initialData - Server-rendered user from the layout (GET /api/auth/me shape).
 *   When auth changes on the client, `invalidateQueries(authKeys.me())` refetches
 *   so UI (e.g. the header) updates without relying on RSC `router.refresh()` alone.
 */
export function useAuthUser(initialData: MeResponse) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    initialData: initialData,
  });
}
