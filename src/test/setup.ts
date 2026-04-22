import { afterAll, afterEach, beforeAll } from "vitest";

import { AUTH_MSW_BASE } from "@/test/msw/constants";
import { mswNodeServer } from "@/test/msw/node-server";

// Deterministic 32+ char secret for auth tests (do not use in production).
process.env.JWT_SECRET ??= "0".repeat(32);

const g = globalThis as typeof globalThis & { __mswAuthTestInit?: true };

beforeAll(() => {
  if (!g.__mswAuthTestInit) {
    g.__mswAuthTestInit = true;
    mswNodeServer.listen({ onUnhandledRequest: "bypass" });
    const mswFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
      if (typeof input === "string" && input.startsWith("/")) {
        return mswFetch(new URL(input, AUTH_MSW_BASE), init);
      }
      return mswFetch(input as RequestInfo, init);
    };
  }
});
afterAll(() => {
  mswNodeServer.close();
  delete g.__mswAuthTestInit;
});
afterEach(() => {
  mswNodeServer.resetHandlers();
});
