"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe, authKeys } from "@/lib/api/auth-queries";

export function useAuthUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
  });
}
