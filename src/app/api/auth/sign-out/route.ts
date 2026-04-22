import { NextResponse } from "next/server";

import { clearSessionTokenInCookies } from "@/lib/auth/cookie-store";

export async function POST() {
  await clearSessionTokenInCookies();
  return NextResponse.json({ ok: true });
}
