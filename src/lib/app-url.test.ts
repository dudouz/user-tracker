import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAppBaseUrl } from "./app-url";

describe("getAppBaseUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    vi.stubEnv("VERCEL_URL", undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("strips a trailing slash from NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com/");
    expect(getAppBaseUrl()).toBe("https://example.com");
  });

  it("uses https://$VERCEL_URL when NEXT_PUBLIC_APP_URL is not set", () => {
    vi.stubEnv("VERCEL_URL", "myapp.vercel.app");
    expect(getAppBaseUrl()).toBe("https://myapp.vercel.app");
  });

  it("falls back to localhost when no env is set", () => {
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });
});
