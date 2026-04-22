import { describe, expect, it } from "vitest";

import { signInSchema, signOutFormSchema, signUpSchema } from "./auth";

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
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty name", () => {
    const r = signUpSchema.safeParse({
      name: "   ",
      email: "a@b.co",
      password: "12345678",
    });
    expect(r.success).toBe(false);
  });
});

describe("signOutFormSchema", () => {
  it("validates an empty object", () => {
    expect(signOutFormSchema.parse({})).toEqual({});
  });
});
