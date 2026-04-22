import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionTokenInCookies } from "@/lib/auth/cookie-store";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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
  const { name, email, password, location, interestedInCommenting } =
    parsed.data;
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
  const passwordHash = await hash(password, 10);
  const wantCommenting = interestedInCommenting ?? false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const referralCode = generateReferralCode();
    try {
      const [row] = await db
        .insert(users)
        .values({
          name: name.trim(),
          email,
          passwordHash,
          referralCode,
          location: normalizedLocation,
          interestedInCommenting: wantCommenting,
        })
        .returning({ id: users.id, email: users.email });
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
  return NextResponse.json({ error: "Could not allocate referral code" }, { status: 500 });
}
