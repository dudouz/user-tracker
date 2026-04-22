import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getSession } from "@/lib/auth/session";

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let v = value.trim();
  if (v.length >= 2) {
    const first = v[0];
    const last = v[v.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      v = v.slice(1, -1).trim();
    }
  }
  return v.length > 0 ? v : undefined;
}

function redactKey(key: string | undefined): string | null {
  if (!key) return null;
  if (key.length < 10) return "***";
  return `${key.slice(0, 4)}…${key.slice(-4)} (len=${key.length})`;
}

/**
 * GET /api/invites/diagnose
 *
 * Session-gated helper to quickly check, from the running VPS process,
 * whether the Resend env is loaded and whether the API key is accepted.
 * Never reveals the full key.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawKey = process.env.RESEND_API_KEY;
  const key = cleanEnv(rawKey);
  const from = cleanEnv(process.env.RESEND_FROM_EMAIL) ?? "onboarding@resend.dev";
  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) ?? null;

  const hadWrappingQuotes = Boolean(
    rawKey &&
      rawKey.length >= 2 &&
      ((rawKey.startsWith('"') && rawKey.endsWith('"')) ||
        (rawKey.startsWith("'") && rawKey.endsWith("'"))),
  );

  const base = {
    env: {
      RESEND_API_KEY: redactKey(key),
      RESEND_API_KEY_wrapped_in_quotes: hadWrappingQuotes,
      RESEND_FROM_EMAIL: from,
      NEXT_PUBLIC_APP_URL: appUrl,
      NODE_ENV: process.env.NODE_ENV ?? null,
    },
  };

  if (!key) {
    return NextResponse.json(
      { ...base, ok: false, stage: "env", error: "RESEND_API_KEY missing" },
      { status: 503 },
    );
  }

  const resend = new Resend(key);

  try {
    const { data, error } = await resend.domains.list();
    if (error) {
      return NextResponse.json(
        {
          ...base,
          ok: false,
          stage: "auth",
          error: error.message,
          code: "name" in error ? (error as { name?: string }).name : undefined,
        },
        { status: 401 },
      );
    }
    const domains = (data?.data ?? []).map((d) => ({
      name: d.name,
      status: d.status,
    }));
    const fromDomain = from.includes("<")
      ? from.split("<")[1]?.replace(">", "").split("@")[1]
      : from.split("@")[1];
    const verified = domains.find(
      (d) => d.name === fromDomain && d.status === "verified",
    );
    return NextResponse.json({
      ...base,
      ok: true,
      stage: "ready",
      from_domain: fromDomain ?? null,
      from_domain_verified: Boolean(verified),
      domains,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const cause =
      e instanceof Error && "cause" in e
        ? (e as { cause?: unknown }).cause
        : undefined;
    return NextResponse.json(
      {
        ...base,
        ok: false,
        stage: "network",
        error: message,
        cause:
          cause && typeof cause === "object"
            ? JSON.parse(JSON.stringify(cause))
            : String(cause ?? ""),
      },
      { status: 502 },
    );
  }
}
