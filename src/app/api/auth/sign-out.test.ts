import { describe, expect, it, vi } from "vitest";

import { AUTH_MSW_BASE } from "@/test/msw/constants";

const { clear } = vi.hoisted(() => ({ clear: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/auth/cookie-store", () => ({
  clearSessionTokenInCookies: () => clear(),
}));

const signOutUrl = `${AUTH_MSW_BASE}/api/auth/sign-out`;

describe("POST /api/auth/sign-out", () => {
  it("clears the session and returns ok", async () => {
    clear.mockClear();
    const res = await fetch(signOutUrl, { method: "POST" });
    expect(clear).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
