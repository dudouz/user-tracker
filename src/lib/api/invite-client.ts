import { readJsonOrEmpty } from "@/lib/api/auth-client";
import type { InviteSendInput } from "@/lib/validations/auth";

export class InviteRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: { error?: string; code?: string; details?: unknown },
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
    const errMsg = typeof body.error === "string" ? body.error : "Failed to send invite";
    const code =
      typeof (body as { code?: string }).code === "string"
        ? (body as { code: string }).code
        : undefined;
    const display = code ? `${errMsg} (code: ${code})` : errMsg;
    throw new InviteRequestError(
      display,
      res.status,
      body as { error?: string; code?: string; details?: unknown },
    );
  }
  return body as { ok: boolean };
}
