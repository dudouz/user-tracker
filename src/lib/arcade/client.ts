/**
 * Arcade MCP client factory.
 *
 * Wraps `@ai-sdk/mcp` `createMCPClient` with the Bearer token persisted by
 * our OAuth provider. Callers are responsible for closing the returned
 * client (e.g. in a `finally` block after `streamText` completes).
 */

import { createMCPClient } from "@ai-sdk/mcp";

import { getArcadeGatewayUrl, oauthProvider } from "@/lib/arcade/oauth";

export type ArcadeMCPClient = Awaited<ReturnType<typeof createMCPClient>>;

export async function getArcadeMCPClient(): Promise<ArcadeMCPClient> {
  const gatewayUrl = getArcadeGatewayUrl();
  const tokens = oauthProvider.tokens();
  const headers = tokens?.access_token
    ? { Authorization: `Bearer ${tokens.access_token}` }
    : undefined;
  const transportType = gatewayUrl.endsWith("/sse") ? "sse" : "http";
  return createMCPClient({
    transport: {
      type: transportType,
      url: gatewayUrl,
      headers,
    },
  });
}

/**
 * Matches anything that looks like a mutation tool (create/update/delete/etc).
 * We filter these out so the chat is strictly read-only in v1.
 */
const MUTATION_VERB =
  /(^|[._])(create|update|delete|remove|add|archive|unarchive|cancel|restore|set|patch|put|post|send|invite|move|rename|duplicate|clone|assign|complete|soft_delete|bulk_)/i;

export function isReadOnlyPosthogTool(name: string): boolean {
  if (!/^posthog[._]/i.test(name)) return false;
  return !MUTATION_VERB.test(name);
}

/** Cap tool result text so large payloads don't blow the model's context. */
const MAX_TOOL_RESULT_CHARS = 4000;

export function truncateToolResult(result: unknown): unknown {
  if (
    result &&
    typeof result === "object" &&
    "content" in (result as Record<string, unknown>)
  ) {
    const obj = result as { content: { type: string; text?: string }[] };
    return {
      ...obj,
      content: obj.content.map((item) => {
        if (
          item.type === "text" &&
          typeof item.text === "string" &&
          item.text.length > MAX_TOOL_RESULT_CHARS
        ) {
          return {
            ...item,
            text:
              item.text.slice(0, MAX_TOOL_RESULT_CHARS) +
              `\n...[truncated ${item.text.length - MAX_TOOL_RESULT_CHARS} chars]`,
          };
        }
        return item;
      }),
    };
  }
  if (typeof result === "string" && result.length > MAX_TOOL_RESULT_CHARS) {
    return (
      result.slice(0, MAX_TOOL_RESULT_CHARS) +
      `\n...[truncated ${result.length - MAX_TOOL_RESULT_CHARS} chars]`
    );
  }
  return result;
}

/**
 * Extract an authorization URL from an MCP tool error/output. Arcade surfaces
 * tool-level OAuth prompts (e.g. "authorize PostHog") via a JSON payload
 * containing `authorization_url`.
 */
export function extractAuthUrl(output: unknown): string | null {
  const fromRecord = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const obj = value as Record<string, unknown>;
    if (typeof obj.authorization_url === "string" && obj.authorization_url) {
      return obj.authorization_url;
    }
    if (obj.structuredContent && typeof obj.structuredContent === "object") {
      const nested = obj.structuredContent as Record<string, unknown>;
      if (
        typeof nested.authorization_url === "string" &&
        nested.authorization_url
      ) {
        return nested.authorization_url;
      }
    }
    return null;
  };

  const direct = fromRecord(output);
  if (direct) return direct;

  const raw =
    typeof output === "string" ? output : JSON.stringify(output ?? "");
  const match = raw.match(
    /https:\/\/[^\s"'\]}>]+\/oauth\/[^\s"'\]}>]+|https:\/\/[^\s"'\]}>]+authorize[^\s"'\]}>]*/i,
  );
  return match ? match[0] : null;
}
