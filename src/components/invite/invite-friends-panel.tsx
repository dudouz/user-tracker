"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendInviteEmailMutation } from "@/hooks/mutations";

export interface InviteFriendsPanelProps {
  baseUrl: string;
  referralCode: string;
}

export function InviteFriendsPanel({
  baseUrl,
  referralCode,
}: InviteFriendsPanelProps) {
  const [email, setEmail] = useState("");
  const { mutate: sendInvite, isPending: isSending } =
    useSendInviteEmailMutation();
  const inviteUrl = (() => {
    try {
      const u = new URL("/sign-up", baseUrl);
      u.searchParams.set("ref", referralCode);
      return u.toString();
    } catch {
      return `${baseUrl.replace(/\/$/, "")}/sign-up?ref=${encodeURIComponent(referralCode)}`;
    }
  })();

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`);
    } catch {
      toast.error("Could not copy");
    }
  }

  function sendEmail() {
    if (isSending) return;
    const to = email.trim();
    if (!to) {
      toast.error("Enter a recipient email");
      return;
    }
    sendInvite(
      { to },
      {
        onSuccess: () => {
          setEmail("");
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="invite-link">Your invite link</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id="invite-link"
            readOnly
            value={inviteUrl}
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 sm:min-w-28"
            onClick={() => {
              void copy(inviteUrl, "link");
            }}
            aria-label="Copy invite link"
          >
            Copy link
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-code">Your invite code</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id="invite-code"
            readOnly
            value={referralCode}
            className="font-mono"
          />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 sm:min-w-28"
            onClick={() => {
              void copy(referralCode, "code");
            }}
            aria-label="Copy invite code"
          >
            Copy code
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Friends can paste this 16-character code on the sign-up form, or use
          the link above.
        </p>
      </div>
      <div
        className="space-y-2"
        data-form-type="other"
      >
        <Label htmlFor="invite-recipient">Email invite to a friend (optional)</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id="invite-recipient"
            type="email"
            name="inviteRecipient"
            autoComplete="off"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            data-lpignore="true"
            placeholder="friend@example.com"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
            }}
            onKeyDown={(ev: KeyboardEvent<HTMLInputElement>) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                sendEmail();
              }
            }}
            disabled={isSending}
          />
          <Button
            className="shrink-0 sm:min-w-28"
            type="button"
            disabled={isSending}
            aria-busy={isSending}
            onClick={sendEmail}
          >
            {isSending ? (
              <>
                <span aria-hidden>Sending…</span>
                <span className="sr-only">Sending invite, please wait</span>
              </>
            ) : (
              "Send email"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses Resend when <code className="font-mono">RESEND_API_KEY</code> is
          set. Otherwise the send action shows an error from the server.
        </p>
      </div>
    </div>
  );
}
