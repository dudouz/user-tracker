import { getSession } from "@/lib/auth/session";
import { getArcadeMCPClient } from "@/lib/arcade/client";
import {
  clearPendingAuthUrl,
  getPendingAuthUrl,
  initiateArcadeOAuth,
  oauthProvider,
} from "@/lib/arcade/oauth";

let connectPromise: Promise<ConnectResult> | null = null;

type ConnectResult = {
  data: Record<string, unknown>;
  status?: number;
};

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ARCADE_GATEWAY_URL?.trim()) {
    return Response.json(
      {
        connected: false,
        error:
          "ARCADE_GATEWAY_URL is missing. Create a gateway at https://app.arcade.dev/mcp-gateways, add the PostHog tools, then set ARCADE_GATEWAY_URL in .env.",
      },
      { status: 400 },
    );
  }

  const existingTokens = oauthProvider.tokens();
  if (existingTokens?.access_token) {
    const status = await verifyExistingConnection();
    if (status === "ok") return Response.json({ connected: true });
    if (status === "unreachable") {
      return Response.json(
        {
          connected: false,
          error:
            "Cannot reach Arcade Gateway. Check ARCADE_GATEWAY_URL and try again.",
        },
        { status: 502 },
      );
    }
  }

  if (!connectPromise) {
    connectPromise = doConnect().finally(() => {
      connectPromise = null;
    });
  }

  const result = await connectPromise;
  return Response.json(
    result.data,
    result.status ? { status: result.status } : undefined,
  );
}

async function doConnect(): Promise<ConnectResult> {
  let mcpClient: Awaited<ReturnType<typeof getArcadeMCPClient>> | null = null;
  try {
    const result = await initiateArcadeOAuth();

    if (result === "REDIRECT") {
      const authUrl = getPendingAuthUrl();
      if (authUrl) {
        clearPendingAuthUrl();
        return { data: { connected: false, authUrl } };
      }
    }

    mcpClient = await getArcadeMCPClient();
    const tools = await mcpClient.tools();
    return {
      data: { connected: true, toolCount: Object.keys(tools).length },
    };
  } catch {
    const authUrl = getPendingAuthUrl();
    if (authUrl) {
      clearPendingAuthUrl();
      return { data: { connected: false, authUrl } };
    }
    return {
      data: {
        connected: false,
        error:
          "Could not connect to Arcade Gateway. Check that ARCADE_GATEWAY_URL is set correctly in your .env file.",
      },
      status: 502,
    };
  } finally {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

async function verifyExistingConnection(): Promise<
  "ok" | "needs_reauth" | "unreachable"
> {
  let mcpClient: Awaited<ReturnType<typeof getArcadeMCPClient>> | null = null;
  try {
    mcpClient = await getArcadeMCPClient();
    await mcpClient.tools();
    return "ok";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/401|403|unauthorized|forbidden/i.test(msg)) return "needs_reauth";
    return "unreachable";
  } finally {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch {
        // ignore
      }
    }
  }
}
