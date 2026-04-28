"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  InviteRequestError,
  postInviteSendEmail,
} from "@/lib/api/invite-client";
import type { InviteSendInput } from "@/lib/validations/auth";

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export function useSendInviteEmailMutation() {
  return useMutation({
    mutationFn: (input: InviteSendInput) => postInviteSendEmail(input),
    onSuccess: () => {
      toast.success("Invite sent");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof InviteRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to send";
      toast.error(message);
    },
  });
}
