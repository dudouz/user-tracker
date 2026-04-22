import { http } from "msw";

import { AUTH_MSW_BASE } from "@/test/msw/constants";

const signIn = `${AUTH_MSW_BASE}/api/auth/sign-in` as const;
const signUp = `${AUTH_MSW_BASE}/api/auth/sign-up` as const;
const signOut = `${AUTH_MSW_BASE}/api/auth/sign-out` as const;
const me = `${AUTH_MSW_BASE}/api/auth/me` as const;

/**
 * Forwards the intercepted request to the in-process App Router route handlers
 * (no `next start` or browser required). Route module mocks in each test file
 * still apply on dynamic import.
 */
export const authApiHandlers = [
  http.get(me, async () => {
    const { GET } = await import("@/app/api/auth/me/route");
    return GET();
  }),
  http.post(signIn, async ({ request }) => {
    const { POST } = await import("@/app/api/auth/sign-in/route");
    return POST(request);
  }),
  http.post(signUp, async ({ request }) => {
    const { POST } = await import("@/app/api/auth/sign-up/route");
    return POST(request);
  }),
  http.post(signOut, async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");
    return POST();
  }),
];
