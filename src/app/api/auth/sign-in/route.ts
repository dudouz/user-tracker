import { compare } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionTokenInCookies } from "@/lib/auth/cookie-store";
import { trackServerEvents } from "@/lib/events";
import { db } from "@/lib/db";
import { referrals, users } from "@/lib/db/schema";
import { signInSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const json: unknown = await request.json();
  const parsed = signInSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }
  const ok = await compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }
  const token = await createSessionToken(user.id, user.email);
  await setSessionTokenInCookies(token);

  const activated = await db
    .update(referrals)
    .set({ status: "activated" })
    .where(
      and(
        eq(referrals.referredUserId, user.id),
        eq(referrals.status, "signup_completed"),
      ),
    )
    .returning({ id: referrals.id });

  await trackServerEvents(
    activated.map((row) => ({
      name: "user_activated",
      properties: { referral_id: row.id },
    })),
    { distinctId: user.id },
  );

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
