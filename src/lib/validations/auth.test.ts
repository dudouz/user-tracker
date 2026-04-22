import { describe, expect, it } from "vitest";

import {
  inviteSendSchema,
  signInSchema,
  signOutFormSchema,
  signUpSchema,
} from "./auth";

describe("signInSchema", () => {
  it("accepts a valid sign-in", () => {
    const r = signInSchema.safeParse({
      email: "a@b.co",
      password: "12345678",
    });
    expect(r.success).toBe(true);
  });

  it("rejects short password", () => {
    const r = signInSchema.safeParse({
      email: "a@b.co",
      password: "short",
    });
    expect(r.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepts a full sign-up body", () => {
    const r = signUpSchema.safeParse({
      name: "Test User",
      email: "a@b.co",
      password: "12345678",
      location: "",
      interestedInCommenting: false,
      referrerCode: "",
    });
    expect(r.success).toBe(true);
  });

  it("normalizes a valid 16-hex referrer code", () => {
    const r = signUpSchema.safeParse({
      name: "Test User",
      email: "a@b.co",
      password: "12345678",
      location: "",
      interestedInCommenting: false,
      referrerCode: "A".repeat(16),
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.referrerCode).toBe("a".repeat(16));
    }
  });

  it("treats empty referrer as omitted", () => {
    const r = signUpSchema.safeParse({
      name: "Test User",
      email: "a@b.co",
      password: "12345678",
      location: "",
      interestedInCommenting: false,
      referrerCode: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.referrerCode).toBeUndefined();
    }
  });

  it("rejects non-hex referrer code", () => {
    const r = signUpSchema.safeParse({
      name: "Test User",
      email: "a@b.co",
      password: "12345678",
      location: "",
      interestedInCommenting: false,
      referrerCode: "g".repeat(16),
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty name", () => {
    const r = signUpSchema.safeParse({
      name: "   ",
      email: "a@b.co",
      password: "12345678",
      location: "",
      interestedInCommenting: false,
      referrerCode: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("inviteSendSchema", () => {
  it("accepts a recipient email", () => {
    const r = inviteSendSchema.safeParse({ to: "friend@example.com" });
    expect(r.success).toBe(true);
  });
});

describe("signOutFormSchema", () => {
  it("validates an empty object", () => {
    expect(signOutFormSchema.parse({})).toEqual({});
  });
});
