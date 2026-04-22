import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetInviteSendRateLimitForTests,
  tryConsumeInviteSendSlot,
} from "./invite-rate-limit";

const userId = "user-1";

describe("tryConsumeInviteSendSlot", () => {
  beforeEach(() => {
    resetInviteSendRateLimitForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to 5 sends per user per window", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(tryConsumeInviteSendSlot(userId)).toBe(true);
    }
    expect(tryConsumeInviteSendSlot(userId)).toBe(false);
  });

  it("resets the window when time advances past 1h", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    for (let i = 0; i < 5; i += 1) {
      tryConsumeInviteSendSlot(userId);
    }
    expect(tryConsumeInviteSendSlot(userId)).toBe(false);
    vi.setSystemTime(now + 60 * 60 * 1000 + 1);
    expect(tryConsumeInviteSendSlot(userId)).toBe(true);
  });
});
