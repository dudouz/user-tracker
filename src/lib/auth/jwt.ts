import { SignJWT, jwtVerify } from "jose";

import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  SESSION_MAX_AGE_SEC,
} from "@/lib/auth/constants";
import { getJwtSecretBytes } from "@/lib/auth/secret";

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSessionToken(
  userId: string,
  email: string,
): Promise<string> {
  const secret = getJwtSecretBytes();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload> {
  const secret = getJwtSecretBytes();
  const { payload } = await jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid session token");
  }
  return { userId: sub, email };
}
