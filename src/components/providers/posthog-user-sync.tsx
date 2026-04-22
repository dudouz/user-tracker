"use client";

import { useEffect, useRef } from "react";

import { identifyPostHogUser, resetPostHogUser } from "@/lib/posthog/identify-user";

export function PostHogUserSync({ userId }: { userId: string | null }) {
  const previous = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (userId) {
      identifyPostHogUser(userId);
    } else if (previous.current) {
      resetPostHogUser();
    }
    previous.current = userId;
  }, [userId]);

  return null;
}
