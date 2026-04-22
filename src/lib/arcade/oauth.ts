/**
 * Arcade MCP Gateway OAuth helper.
 *
 * Ported from the reference repo (../ddz-command-center) and trimmed down:
 * - File-based token/client persistence under `.arcade-auth/` (gitignored).
 * - Implements `OAuthClientProvider` from the MCP SDK so the gateway can
 *   drive the authorization-code + PKCE flow on the user's behalf.
 *
 * NOTE: This is app-level storage (single tenant). Multi-user production
 * deployments should persist tokens + PKCE verifiers per user.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";

import { getAppBaseUrl } from "@/lib/app-url";

export function getArcadeGatewayUrl(): string {
  const value = process.env.ARCADE_GATEWAY_URL?.trim();
  if (!value) {
    throw new Error(
      "ARCADE_GATEWAY_URL is missing. Create a gateway at https://app.arcade.dev/mcp-gateways, add PostHog tools, then set ARCADE_GATEWAY_URL in .env.",
    );
  }
  return value;
}

function getCallbackUrl(): string {
  return `${getAppBaseUrl()}/api/auth/arcade/callback`;
}

const AUTH_DIR = join(process.cwd(), ".arcade-auth");
const CLIENT_FILE = join(AUTH_DIR, "client.json");
const TOKENS_FILE = join(AUTH_DIR, "tokens.json");
const VERIFIER_FILE = join(AUTH_DIR, "verifier.txt");
const PENDING_AUTH_URL_FILE = join(AUTH_DIR, "pending-auth-url.txt");

function ensureDir() {
  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 });
  }
}

function readJson<T>(path: string): T | undefined {
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    // ignore parse errors — fall through
  }
  return undefined;
}

function writeJson(path: string, data: unknown) {
  ensureDir();
  writeFileSync(path, JSON.stringify(data, null, 2), { mode: 0o600 });
}

const PENDING_AUTH_TTL_MS = 5 * 60 * 1000;

function setPendingAuthUrl(url: string) {
  ensureDir();
  writeFileSync(
    PENDING_AUTH_URL_FILE,
    JSON.stringify({ url, createdAt: Date.now() }),
    { encoding: "utf-8", mode: 0o600 },
  );
}

export function getPendingAuthUrl(): string | null {
  if (!existsSync(PENDING_AUTH_URL_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(PENDING_AUTH_URL_FILE, "utf-8")) as {
      url: string;
      createdAt: number;
    };
    if (Date.now() - data.createdAt > PENDING_AUTH_TTL_MS) {
      clearPendingAuthUrl();
      return null;
    }
    return data.url;
  } catch {
    return null;
  }
}

export function clearPendingAuthUrl() {
  try {
    unlinkSync(PENDING_AUTH_URL_FILE);
  } catch {
    // best-effort cleanup
  }
}

class ArcadeOAuthProvider implements OAuthClientProvider {
  get redirectUrl() {
    return getCallbackUrl();
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      redirect_uris: [getCallbackUrl()],
      client_name: "User Tracker Insights",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
  }

  clientInformation(): OAuthClientInformationFull | undefined {
    return readJson<OAuthClientInformationFull>(CLIENT_FILE);
  }

  saveClientInformation(info: OAuthClientInformationFull) {
    writeJson(CLIENT_FILE, info);
  }

  tokens(): OAuthTokens | undefined {
    return readJson<OAuthTokens>(TOKENS_FILE);
  }

  saveTokens(tokens: OAuthTokens) {
    writeJson(TOKENS_FILE, tokens);
  }

  async redirectToAuthorization(authorizationUrl: URL) {
    setPendingAuthUrl(authorizationUrl.toString());
  }

  saveCodeVerifier(verifier: string) {
    ensureDir();
    writeFileSync(VERIFIER_FILE, verifier, { mode: 0o600 });
  }

  codeVerifier(): string {
    return readFileSync(VERIFIER_FILE, "utf-8");
  }
}

export const oauthProvider = new ArcadeOAuthProvider();

export { auth };

/**
 * Trigger the MCP OAuth discovery + PKCE flow. Returns "AUTHORIZED" when
 * tokens are already valid and "REDIRECT" when the user needs to visit
 * the auth URL surfaced via `getPendingAuthUrl()`.
 */
export async function initiateArcadeOAuth(): Promise<"AUTHORIZED" | "REDIRECT"> {
  return auth(oauthProvider, { serverUrl: getArcadeGatewayUrl() });
}
