# Invites, referral links, and Resend

## Invite links and `NEXT_PUBLIC_APP_URL`

- **Copy link** and **invite emails** use `getAppBaseUrl()` ([`src/lib/app-url.ts`](../src/lib/app-url.ts)), which reads (in order):
  1. `NEXT_PUBLIC_APP_URL` (recommended in production)
  2. `https://${VERCEL_URL}` on Vercel when that env is set
  3. `http://localhost:3000` as a local fallback

- On **localhost**, invite links in emails will point at `http://localhost:3000/...` unless you set `NEXT_PUBLIC_APP_URL`. That is fine for manual copy/paste, but it is a poor target for people opening the email on another device.

- To test **on your real domain** (typical on Resend’s free tier where you can verify **one** sending domain and want links to match):

  1. Deploy the app to that host (e.g. Vercel) or use a tunnel.
  2. Set in the environment:
     - `NEXT_PUBLIC_APP_URL=https://yourdomain.com` (no trailing slash; used for links in the UI and in emails)
     - `RESEND_API_KEY` (server-only)
     - `RESEND_FROM_EMAIL` to an address you are allowed to send from (see below)

## Resend, localhost, and “one domain”

- **Sending email** is done only on the server ([`src/app/api/invites/send/route.ts`](../src/app/api/invites/send/route.ts)) with the **Resend** API. Keep `RESEND_API_KEY` private (never `NEXT_PUBLIC_`).

- For development, Resend often allows the sandbox **`onboarding@resend.dev`** as the **From** address. You can set `RESEND_FROM_EMAIL=onboarding@resend.dev` or omit it; the app defaults to that when unset.

- For **custom domains**, Resend requires you to **verify the domain** (DNS) before you can send as `you@yourdomain.com`. The free tier may limit how many domains you can verify; using that domain for both **sending** and as **`NEXT_PUBLIC_APP_URL`** keeps invite links and email aligned.

- If deliverability fails, check the Resend dashboard. Common issues are unverified `from` address or bad API key. The link inside the email must be reachable: use a deployed URL via `NEXT_PUBLIC_APP_URL` when testing end-to-end on your domain.

## What the tests cover

- `src/lib/app-url.test.ts` – base URL resolution
- `src/lib/invite-rate-limit.test.ts` – per-user send cap
- `src/app/api/invites/send/route.test.ts` – auth, validation, Resend, rate limit, and link contents (mocked Resend)
- `src/app/api/auth/sign-up.referral.test.ts` – invalid / valid referral code (mocked DB)
