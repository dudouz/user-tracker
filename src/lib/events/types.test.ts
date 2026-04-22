import { describe, expect, it } from "vitest";

import type { AnalyticsEvent } from "@/lib/events/types";

describe("AnalyticsEvent", () => {
  it("narrows by event name", () => {
    const e: AnalyticsEvent = {
      name: "signup_step_viewed",
      properties: {
        step_key: "account",
        step_label: "Account & invite",
      },
    };
    if (e.name === "signup_step_viewed") {
      expect(e.properties.step_key).toBe("account");
    }
  });
});
