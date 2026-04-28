export interface ConnectInsightsResponse {
  connected: boolean;
  authUrl?: string;
  toolCount?: number;
  error?: string;
}

// The /api/insights/connect endpoint returns a useful body even on non-2xx
// responses (e.g. 502 with `error` describing why the gateway is unreachable),
// so we don't throw on !res.ok and let callers branch on the body shape.
export async function postInsightsConnect(): Promise<ConnectInsightsResponse> {
  const res = await fetch("/api/insights/connect", { method: "POST" });
  const text = await res.text();
  if (!text) {
    return {
      connected: false,
      error: res.statusText || "Could not reach Arcade gateway.",
    };
  }
  try {
    return JSON.parse(text) as ConnectInsightsResponse;
  } catch {
    return {
      connected: false,
      error: res.statusText || "Could not reach Arcade gateway.",
    };
  }
}
