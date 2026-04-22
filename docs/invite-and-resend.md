# Invites, referral links, and Resend

## Public URL (`NEXT_PUBLIC_APP_URL`)

- **Copy link** on `/invite` and the link inside **invite emails** both use `getAppBaseUrl()` in [`src/lib/app-url.ts`](../src/lib/app-url.ts):
  1. `NEXT_PUBLIC_APP_URL` if set (use your real public origin, e.g. `https://yourdomain.com`, no trailing slash)
  2. Otherwise `https://${VERCEL_URL}` on Vercel
  3. Otherwise `http://localhost:3000` for local dev

- In production, **set** `NEXT_PUBLIC_APP_URL` so links are never wrong. Without it, you get localhost outside Vercel.

## Resend

- **Sending email** is server-only ([`src/app/api/invites/send/route.ts`](../src/app/api/invites/send/route.ts)). Use **`RESEND_API_KEY`** (not `NEXT_PUBLIC_`).

- For development, **`onboarding@resend.dev`** is a common default for **From**; set **`RESEND_FROM_EMAIL`** to your verified address in production.

- Verify your domain in Resend if you send from your own domain. Align that domain with **`NEXT_PUBLIC_APP_URL`** so invite links and your site match.

## What the tests cover

- `src/lib/app-url.test.ts` – base URL from env
- `src/lib/invite-rate-limit.test.ts` – per-user send cap
- `src/app/api/invites/send/route.test.ts` – auth, validation, Resend, rate limit, link in email
- `src/app/api/auth/sign-up.referral.test.ts` – invalid / valid referral (mocked DB)
