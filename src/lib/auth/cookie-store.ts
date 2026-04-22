import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
} from "@/lib/auth/constants";

const secure = process.env.NODE_ENV === "production";

function baseOptions() {
  return {
    path: "/" as const,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function setSessionTokenInCookies(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, baseOptions());
}

export async function clearSessionTokenInCookies() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 0,
  });
}
