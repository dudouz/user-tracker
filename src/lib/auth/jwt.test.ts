import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "./jwt";

describe("createSessionToken / verifySessionToken", () => {
  it("round-trips a session payload", async () => {
    const token = await createSessionToken(
      "550e8400-e29b-41d4-a716-446655440000",
      "user@test.com",
    );
    const { userId, email } = await verifySessionToken(token);
    expect(userId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(email).toBe("user@test.com");
  });

  it("rejects invalid token", async () => {
    await expect(verifySessionToken("not-a-jwt")).rejects.toThrow();
  });
});
