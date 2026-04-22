import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getAppBaseUrl } from "@/lib/app-url";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { inviteSendSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set on the server." },
      { status: 503 },
    );
  }
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";

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

  const base = getAppBaseUrl();
  const signUpUrl = new URL("/sign-up", base);
  signUpUrl.searchParams.set("ref", row.referralCode);
  const link = signUpUrl.toString();

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `${row.name} invited you`,
      text: `Join with this link:\n\n${link}\n\nOr open sign up and enter invite code: ${row.referralCode}`,
      html: `<p>Join with this link:</p><p><a href="${link}">${link}</a></p><p>Or open sign up and enter invite code: <code>${row.referralCode}</code></p>`,
    });

    if (error) {
      const { name, message } = error as { name?: string; message?: string };
      console.error("[invites/send] Resend error", {
        code: name,
        message,
        from,
        toDomain: to.split("@")[1],
      });
      return NextResponse.json(
        { error: message || "Failed to send email", code: name },
        { status: 400 },
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    console.error("[invites/send] SDK/network error", {
      message,
      cause: e instanceof Error && "cause" in e ? (e as { cause?: unknown }).cause : undefined,
    });
    return NextResponse.json(
      { error: message, code: "network_error" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
