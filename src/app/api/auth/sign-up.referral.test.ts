import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MSW_BASE } from "@/test/msw/constants";

const { limit } = vi.hoisted(() => ({ limit: vi.fn() }));

const newUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "newer@test.com",
};

vi.mock("@/lib/auth/cookie-store", () => ({
  setSessionTokenInCookies: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => limit() }),
      }),
    }),
    transaction: async (fn: (tx: { insert: () => { values: () => unknown } }) => Promise<typeof newUser | null>) => {
      let insertN = 0;
      const tx = {
        insert: () => {
          insertN += 1;
          if (insertN === 1) {
            return {
              values: () => ({
                returning: () => Promise.resolve([newUser]),
              }),
            };
          }
          return {
            values: () => Promise.resolve(),
          };
        },
      };
      return fn(tx);
    },
  },
}));

const signUpUrl = `${AUTH_MSW_BASE}/api/auth/sign-up`;

function postSignUpJson(body: unknown) {
  return fetch(signUpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "New User",
  email: "newer@test.com",
  password: "12345678",
  location: "",
  interestedInCommenting: false,
  referrerCode: "a1b2c3d4e5f6a7b8",
};

describe("POST /api/auth/sign-up (referral)", () => {
  beforeEach(() => {
    limit.mockReset();
  });

  it("returns 400 when referral code does not match any user", async () => {
    limit.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const res = await postSignUpJson(validBody);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("Invalid referral code");
  });

  it("returns 201 when referral is valid", async () => {
    const referrer = {
      id: "22222222-2222-2222-2222-222222222222",
      referralCode: "a1b2c3d4e5f6a7b8",
    };
    limit.mockResolvedValueOnce([]).mockResolvedValueOnce([referrer]);
    const res = await postSignUpJson(validBody);
    expect(res.status).toBe(201);
    const j = (await res.json()) as { user: { email: string } };
    expect(j.user.email).toBe("newer@test.com");
  });
});
