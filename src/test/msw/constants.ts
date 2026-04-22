/**
 * Test origin; must match MSW `authApiHandlers` and the fetch shim in
 * `src/test/setup.ts` so `fetch("/api/...")` works in Node.
 */
export const AUTH_MSW_BASE = "http://localhost:3000";
