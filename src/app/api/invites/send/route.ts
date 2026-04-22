import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getAppBaseUrl } from "@/lib/app-url";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { tryConsumeInviteSendSlot } from "@/lib/invite-rate-limit";
import { inviteSendSchema } from "@/lib/validations/auth";

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { error: "Email sending is not configured (set RESEND_API_KEY on the server)." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { to } = parsed.data;

  const [row] = await db
    .select({ name: users.name, referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!tryConsumeInviteSendSlot(session.userId)) {
    return NextResponse.json(
      { error: "Too many invite emails. Try again in about an hour." },
      { status: 429 },
    );
  }

  const base = getAppBaseUrl();
  const signUpUrl = new URL("/sign-up", base);
  signUpUrl.searchParams.set("ref", row.referralCode);
  const link = signUpUrl.toString();
  const from = getFromAddress();

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `${row.name} invited you`,
    text: `Join with this link:\n\n${link}\n\nOr open sign up and enter invite code: ${row.referralCode}`,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
