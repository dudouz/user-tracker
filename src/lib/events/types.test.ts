import { describe, expect, it } from "vitest";

import type { AnalyticsEvent } from "@/lib/events";

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

  it("narrows signup_wizard_abandoned with reason + time_on_step_ms", () => {
    const e: AnalyticsEvent = {
      name: "signup_wizard_abandoned",
      properties: {
        step_key: "location_interest",
        step_label: "Location & interest",
        reason: "tab_closed",
        time_on_step_ms: 1234,
      },
    };
    if (e.name === "signup_wizard_abandoned") {
      expect(e.properties.reason).toBe("tab_closed");
      expect(e.properties.time_on_step_ms).toBe(1234);
    }
  });

  it("narrows sign_in_failed to a bucketed code", () => {
    const e: AnalyticsEvent = {
      name: "sign_in_failed",
      properties: { code: "invalid_credentials" },
    };
    if (e.name === "sign_in_failed") {
      expect(e.properties.code).toBe("invalid_credentials");
    }
  });

  it("narrows sign_in_abandoned with reason + time_on_page_ms", () => {
    const e: AnalyticsEvent = {
      name: "sign_in_abandoned",
      properties: { reason: "navigated_away", time_on_page_ms: 500 },
    };
    if (e.name === "sign_in_abandoned") {
      expect(e.properties.reason).toBe("navigated_away");
    }
  });

  it("narrows comment_abandoned with had_draft", () => {
    const e: AnalyticsEvent = {
      name: "comment_abandoned",
      properties: { photo_id: 7, had_draft: true, reason: "navigated_away" },
    };
    if (e.name === "comment_abandoned") {
      expect(e.properties.had_draft).toBe(true);
    }
  });
});
