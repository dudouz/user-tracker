import { beforeEach, describe, expect, it, vi } from "vitest";

import { postSignOut } from "@/lib/api/auth-client";

const { clear } = vi.hoisted(() => ({ clear: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/auth/cookie-store", () => ({
  clearSessionTokenInCookies: () => clear(),
}));

describe("auth-client (fetch via MSW)", () => {
  beforeEach(() => {
    clear.mockClear();
  });

  it("postSignOut succeeds when route returns 200", async () => {
    await expect(postSignOut()).resolves.toBeUndefined();
    expect(clear).toHaveBeenCalled();
  });
});
