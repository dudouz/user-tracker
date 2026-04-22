import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetInviteSendRateLimitForTests, tryConsumeInviteSendSlot } from "@/lib/invite-rate-limit";

const sessionUserId = "550e8400-e29b-41d4-a716-446655440000";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
const selectLimit = vi.hoisted(() => vi.fn());
const emailSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: "email-1" } }),
);

vi.mock("@/lib/auth/session", () => ({
  getSession: () => getSession(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: emailSend };
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => selectLimit() }),
      }),
    }),
  },
}));

const referrerRow = {
  name: "Ref User",
  referralCode: "a1b2c3d4e5f6a7b8",
};

function postSend(body: unknown) {
  return import("./route").then(({ POST }) =>
    POST(
      new Request("http://localhost/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  );
}

describe("POST /api/invites/send", () => {
  beforeEach(() => {
    getSession.mockReset();
    selectLimit.mockReset();
    emailSend.mockReset();
    emailSend.mockResolvedValue({ data: { id: "email-1" } });
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
    resetInviteSendRateLimitForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when not authenticated", async () => {
    getSession.mockResolvedValue(null);
    const res = await postSend({ to: "f@x.com" });
    expect(res.status).toBe(401);
  });

  it("returns 503 when RESEND_API_KEY is missing", async () => {
    vi.unstubAllEnvs();
    getSession.mockResolvedValue({ userId: sessionUserId, email: "a@b.co" });
    const res = await postSend({ to: "f@x.com" });
    expect(res.status).toBe(503);
  });

  it("returns 400 for invalid body", async () => {
    getSession.mockResolvedValue({ userId: sessionUserId, email: "a@b.co" });
    const res = await postSend({ to: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the user row is missing", async () => {
    getSession.mockResolvedValue({ userId: sessionUserId, email: "a@b.co" });
    selectLimit.mockResolvedValueOnce([]);
    const res = await postSend({ to: "f@x.com" });
    expect(res.status).toBe(404);
  });

  it("returns 429 when the hourly cap is reached", async () => {
    getSession.mockResolvedValue({ userId: sessionUserId, email: "a@b.co" });
    selectLimit.mockResolvedValue([referrerRow]);
    for (let i = 0; i < 5; i += 1) {
      tryConsumeInviteSendSlot(sessionUserId);
    }
    const res = await postSend({ to: "f@x.com" });
    expect(res.status).toBe(429);
  });

  it("sends an email and returns 200 with invite link to configured base URL", async () => {
    getSession.mockResolvedValue({ userId: sessionUserId, email: "a@b.co" });
    selectLimit.mockResolvedValue([referrerRow]);
    const res = await postSend({ to: "friend@x.com" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(emailSend).toHaveBeenCalledTimes(1);
    const [payload] = emailSend.mock.calls[0] as [
      { from: string; to: string[]; subject: string; text: string },
    ];
    expect(payload.from).toBe("onboarding@resend.dev");
    expect(payload.to).toEqual(["friend@x.com"]);
    expect(payload.subject).toContain("Ref User");
    expect(payload.text).toContain(
      "https://app.example.com/sign-up?ref=a1b2c3d4e5f6a7b8",
    );
  });

  it("returns 502 when Resend returns an error", async () => {
    getSession.mockResolvedValue({ userId: sessionUserId, email: "a@b.co" });
    selectLimit.mockResolvedValue([referrerRow]);
    emailSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Resend error" } as { message: string },
    });
    const res = await postSend({ to: "friend@x.com" });
    expect(res.status).toBe(502);
  });
});
