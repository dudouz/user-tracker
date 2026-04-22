import { hashSync } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MSW_BASE } from "@/test/msw/constants";

const testUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@test.com",
  passwordHash: hashSync("password12", 4),
};

const { limit, updateReturning } = vi.hoisted(() => ({
  limit: vi.fn(),
  updateReturning: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/auth/cookie-store", () => ({
  setSessionTokenInCookies: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => limit(),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => updateReturning(),
        }),
      }),
    }),
  },
}));

const signInUrl = `${AUTH_MSW_BASE}/api/auth/sign-in`;

function postSignInJson(body: unknown) {
  return fetch(signInUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/sign-in", () => {
  beforeEach(() => {
    limit.mockReset();
    updateReturning.mockReset();
    updateReturning.mockResolvedValue([]);
  });

  it("returns 400 for invalid body", async () => {
    const res = await postSignInJson({ email: "bad" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is missing", async () => {
    limit.mockResolvedValueOnce([]);
    const res = await postSignInJson({
      email: "user@test.com",
      password: "password12",
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when password is wrong", async () => {
    limit.mockResolvedValueOnce([testUser]);
    const res = await postSignInJson({
      email: "user@test.com",
      password: "wrongpass1",
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 and user when credentials match", async () => {
    limit.mockResolvedValueOnce([testUser]);
    const res = await postSignInJson({
      email: "user@test.com",
      password: "password12",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string } };
    expect(body.user.email).toBe("user@test.com");
  });
});
