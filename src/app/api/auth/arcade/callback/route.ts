import { NextResponse } from "next/server";

import { getAppBaseUrl } from "@/lib/app-url";
import { auth, oauthProvider } from "@/lib/arcade/oauth";

function redirect(path: string) {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return NextResponse.redirect(`${base}${path}`);
}

export async function GET(req: Request) {
  const gatewayUrl = process.env.ARCADE_GATEWAY_URL?.trim();
  if (!gatewayUrl) {
    return redirect("/insights?error=gateway_missing");
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 },
    );
  }

  try {
    const result = await auth(oauthProvider, {
      serverUrl: gatewayUrl,
      authorizationCode: code,
    });

    if (result === "AUTHORIZED") {
      return redirect("/insights?connected=1");
    }
    return redirect("/insights?error=auth_incomplete");
  } catch (error) {
    console.error("[arcade] OAuth callback error:", error);
    return redirect("/insights?error=auth_failed");
  }
}
