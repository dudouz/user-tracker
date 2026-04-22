import type { SignInInput, SignUpInput } from "@/lib/validations/auth";

export interface AuthUser {
  id: string;
  email: string;
}

export interface MeResponse {
  user: AuthUser | null;
}

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: { error?: string; details?: unknown },
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}

export async function readJsonOrEmpty(res: Response) {
  const text = await res.text();
  if (!text) return {} as { error?: string; details?: unknown };
  try {
    return JSON.parse(text) as { error?: string; details?: unknown };
  } catch {
    return { error: res.statusText } as { error?: string };
  }
}

export async function postSignIn(
  input: SignInInput,
): Promise<{ user: { id: string; email: string } }> {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJsonOrEmpty(res);
  if (!res.ok) {
    throw new AuthRequestError(
      typeof body.error === "string" ? body.error : "Sign in failed",
      res.status,
      body,
    );
  }
  return body as { user: { id: string; email: string } };
}

export async function postSignUp(
  input: SignUpInput,
): Promise<{ user: { id: string; email: string } }> {
  const res = await fetch("/api/auth/sign-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      location: input.location || undefined,
      interestedInCommenting: input.interestedInCommenting === true,
      ...(input.referrerCode ? { referrerCode: input.referrerCode } : {}),
    }),
  });
  const body = await readJsonOrEmpty(res);
  if (!res.ok) {
    throw new AuthRequestError(
      typeof body.error === "string" ? body.error : "Sign up failed",
      res.status,
      body,
    );
  }
  return body as { user: { id: string; email: string } };
}

export async function postSignOut(): Promise<void> {
  const res = await fetch("/api/auth/sign-out", { method: "POST" });
  if (!res.ok) {
    const body = await readJsonOrEmpty(res);
    throw new AuthRequestError(
      typeof body.error === "string" ? body.error : "Sign out failed",
      res.status,
      body,
    );
  }
}
