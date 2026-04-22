import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AUTH_SIGN_IN_PATH,
  JWT_AUDIENCE,
  JWT_ISSUER,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { getJwtSecretBytes } from "@/lib/auth/secret";

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return redirectToSignIn(request);
  }
  try {
    const secret = getJwtSecretBytes();
    await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    return redirectToSignIn(request);
  }
  return NextResponse.next();
}

function redirectToSignIn(request: NextRequest) {
  const signIn = new URL(AUTH_SIGN_IN_PATH, request.nextUrl);
  const pathWithQuery =
    request.nextUrl.pathname + (request.nextUrl.search || "");
  if (pathWithQuery && pathWithQuery !== "/") {
    signIn.searchParams.set("callbackUrl", pathWithQuery);
  }
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/dashboard/:path*", "/invite", "/invite/:path*"],
};
