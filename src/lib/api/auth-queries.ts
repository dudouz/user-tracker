import {
  AuthRequestError,
  type MeResponse,
  readJsonOrEmpty,
} from "@/lib/api/auth-client";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * Fetches the current user for React Query (GET /api/auth/me).
 * Expects 200 with `{ user }` (null when not signed in).
 */
export async function getMe(): Promise<MeResponse> {
  const res = await fetch("/api/auth/me");
  const body = (await readJsonOrEmpty(res)) as MeResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new AuthRequestError(
      body.error || "Request failed",
      res.status,
      body,
    );
  }
  return { user: body.user ?? null };
}
