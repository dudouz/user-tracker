import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { getInsightsModel } from "@/lib/ai/model";
import {
  extractAuthUrl,
  getArcadeMCPClient,
  isReadOnlyPosthogTool,
  truncateToolResult,
} from "@/lib/arcade/client";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;

let cachedSystemPrompt: string | undefined;
function getSystemPrompt(): string {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = readFileSync(
      join(process.cwd(), "src/lib/ai/insights-prompt.md"),
      "utf-8",
    );
  }
  return cachedSystemPrompt;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let messages: UIMessage[] = [];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  let mcpClient: Awaited<ReturnType<typeof getArcadeMCPClient>> | null = null;
  try {
    mcpClient = await getArcadeMCPClient();
    const allTools = await mcpClient.tools();

    const tools: typeof allTools = {};
    for (const [name, tool] of Object.entries(allTools)) {
      if (!isReadOnlyPosthogTool(name)) continue;
      const orig = tool.execute;
      tools[name] = {
        ...tool,
        execute: orig
          ? async (args: Record<string, unknown>, opts: unknown) => {
              const result = await (
                orig as (...a: unknown[]) => unknown
              ).call(null, args, opts);
              const authUrl = extractAuthUrl(result);
              if (authUrl) {
                return {
                  content: [
                    {
                      type: "text",
                      text: `AUTHORIZATION_REQUIRED: ${authUrl}\nAsk the user to visit this URL to grant access, then retry.`,
                    },
                  ],
                };
              }
              return truncateToolResult(result);
            }
          : undefined,
      } as (typeof allTools)[string];
    }

    const toolNames = Object.keys(tools);
    if (toolNames.length === 0) {
      return Response.json(
        {
          error:
            "No read-only PostHog tools found on the Arcade Gateway. Add the PostHog toolkit at https://app.arcade.dev/mcp-gateways.",
        },
        { status: 424 },
      );
    }

    const clientToClose = mcpClient;
    const modelMessages = await convertToModelMessages(messages);
    const stream = streamText({
      model: getInsightsModel(),
      system: getSystemPrompt(),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(8),
      onFinish: async () => {
        try {
          await clientToClose.close();
        } catch {
          // ignore
        }
      },
      onError: async ({ error }) => {
        console.error("[insights.chat] streamText error:", error);
        try {
          await clientToClose.close();
        } catch {
          // ignore
        }
      },
    });
    mcpClient = null;

    return stream.toUIMessageStreamResponse();
  } catch (error) {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch {
        // ignore
      }
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isAuthError =
      /401|Missing Authorization|Unauthorized|Forbidden/i.test(msg);
    console.error("[insights.chat] Error:", error);
    return Response.json(
      {
        error: isAuthError
          ? "Not connected to Arcade. Click Connect on the Insights page to authorize the gateway."
          : msg,
      },
      { status: isAuthError ? 401 : 500 },
    );
  }
}
