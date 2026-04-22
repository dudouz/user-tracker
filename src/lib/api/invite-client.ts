import { readJsonOrEmpty } from "@/lib/api/auth-client";
import type { InviteSendInput } from "@/lib/validations/auth";

export class InviteRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: { error?: string; details?: unknown },
  ) {
    super(message);
    this.name = "InviteRequestError";
  }
}

export async function postInviteSendEmail(
  input: InviteSendInput,
): Promise<{ ok: boolean }> {
  const res = await fetch("/api/invites/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJsonOrEmpty(res);
  if (!res.ok) {
    throw new InviteRequestError(
      typeof body.error === "string" ? body.error : "Failed to send invite",
      res.status,
      body,
    );
  }
  return body as { ok: boolean };
}
