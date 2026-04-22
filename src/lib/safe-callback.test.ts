import { describe, expect, it } from "vitest";

import { getSafeCallbackUrl } from "./safe-callback";

describe("getSafeCallbackUrl", () => {
  it("uses fallback for null, undefined, empty", () => {
    expect(getSafeCallbackUrl(null, "/d")).toBe("/d");
    expect(getSafeCallbackUrl(undefined, "/d")).toBe("/d");
    expect(getSafeCallbackUrl("", "/d")).toBe("/d");
  });

  it("allows same-origin paths", () => {
    expect(getSafeCallbackUrl("/foo", "/home")).toBe("/foo");
    expect(getSafeCallbackUrl("/some/nested?x=1", "/home")).toBe(
      "/some/nested?x=1",
    );
  });

  it("rejects open redirects and protocol-relative URLs", () => {
    expect(getSafeCallbackUrl("//evil.com", "/home")).toBe("/home");
    expect(getSafeCallbackUrl("https://evil.com", "/home")).toBe("/home");
    expect(getSafeCallbackUrl("///triple", "/home")).toBe("/home");
  });
});
