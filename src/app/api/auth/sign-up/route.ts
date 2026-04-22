import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionTokenInCookies } from "@/lib/auth/cookie-store";
import { db } from "@/lib/db";
import { referrals, users } from "@/lib/db/schema";
import { signUpSchema } from "@/lib/validations/auth";

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

function generateReferralCode(): string {
  return randomBytes(8).toString("hex");
}

export async function POST(request: Request) {
  const json: unknown = await request.json();
  const parsed = signUpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const {
    name,
    email,
    password,
    location,
    interestedInCommenting,
    referrerCode,
  } = parsed.data;
  const normalizedLocation =
    location && location.length > 0 ? location : undefined;
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  let referrer: { id: string; referralCode: string } | null = null;
  if (referrerCode) {
    const [r] = await db
      .select({ id: users.id, referralCode: users.referralCode })
      .from(users)
      .where(eq(users.referralCode, referrerCode))
      .limit(1);
    if (!r) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 },
      );
    }
    referrer = r;
  }

  const passwordHash = await hash(password, 10);
  const wantCommenting = interestedInCommenting ?? false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const newUserReferralCode = generateReferralCode();
    try {
      const row = await db.transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            name: name.trim(),
            email,
            passwordHash,
            referralCode: newUserReferralCode,
            location: normalizedLocation,
            interestedInCommenting: wantCommenting,
          })
          .returning({ id: users.id, email: users.email });
        if (!u) {
          return null;
        }
        if (referrer) {
          await tx.insert(referrals).values({
            referrerUserId: referrer.id,
            referredUserId: u.id,
            referralCode: referrer.referralCode,
            status: "signup_completed",
          });
        }
        return u;
      });
      if (!row) {
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 },
        );
      }
      const token = await createSessionToken(row.id, row.email);
      await setSessionTokenInCookies(token);
      return NextResponse.json(
        { user: { id: row.id, email: row.email } },
        { status: 201 },
      );
    } catch (e) {
      if (isPgUniqueViolation(e) && attempt < 4) continue;
      throw e;
    }
  }
  return NextResponse.json(
    { error: "Could not allocate referral code" },
    { status: 500 },
  );
}
