import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MSW_BASE } from "@/test/msw/constants";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({
  getSession: () => getSession(),
}));

const meUrl = `${AUTH_MSW_BASE}/api/auth/me`;

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("returns 200 with user: null when unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await fetch(meUrl);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: null };
    expect(body.user).toBeNull();
  });

  it("returns 200 with user when authenticated", async () => {
    getSession.mockResolvedValueOnce({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "a@b.co",
    });
    const res = await fetch(meUrl);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string } };
    expect(body.user.email).toBe("a@b.co");
  });
});
