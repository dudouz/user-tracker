import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "@/lib/api/auth-queries";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({
  getSession: () => getSession(),
}));

describe("getMe", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("returns null user when unauthenticated (MSW + route)", async () => {
    getSession.mockResolvedValueOnce(null);
    const data = await getMe();
    expect(data.user).toBeNull();
  });

  it("returns user when session exists (MSW + route)", async () => {
    getSession.mockResolvedValueOnce({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "a@b.co",
    });
    const data = await getMe();
    expect(data.user).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "a@b.co",
    });
  });
});
