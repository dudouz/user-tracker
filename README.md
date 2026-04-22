# User Tracker

A reference Next.js 16 app that demonstrates **first-party product analytics**: sign-ups, referrals, all instrumented end-to-end with PostHog. It also ships an **Insights chat page** that lets a signed-in operator ask natural-language questions about their product data — the assistant answers by calling PostHog tools over the [Arcade MCP Gateway](https://app.arcade.dev/mcp-gateways).

## What's in the box

- **Auth** — email + password with `bcryptjs`, JWT sessions signed with `jose`, HTTP-only cookies.
- **Referrals** — every user gets a `referralCode`; `/invite/:code` links are tracked from click to activation.
- **Analytics** — typed event taxonomy in `src/lib/events/types.ts`, captured both client-side (`posthog-js`) and server-side (`posthog-node`).
- **Insights agent** — `/insights` is an `@ai-sdk/react` chat UI backed by OpenAI + the Arcade MCP Gateway, so the model can run real PostHog queries (HogQL, trends, funnels, retention) on behalf of the operator. Read-only by design (mutation tools are filtered out in `src/lib/arcade/client.ts`).
- **Transactional email** — invite emails via [Resend](https://resend.com).
- **Database** — PostgreSQL 16 via Docker, [Drizzle ORM](https://orm.drizzle.team) for schema and migrations.
- **UI** — Tailwind v4, shadcn/ui, Radix primitives, Sonner toasts, React Query.
- **Tests** — Vitest + Testing Library, MSW for network mocking, Playwright available for e2e.

## Tech stack

| Area        | Choice                                       |
| ----------- | -------------------------------------------- |
| Framework   | Next.js 16 (App Router, RSC), React 19       |
| Styling     | Tailwind CSS v4, shadcn/ui, Radix            |
| Data        | PostgreSQL 16, Drizzle ORM, `pg`             |
| Auth        | `bcryptjs`, `jose` (JWT), HTTP-only cookies  |
| Analytics   | PostHog (`posthog-js`, `posthog-node`)       |
| AI          | `ai` SDK v6, `@ai-sdk/openai`, `@ai-sdk/mcp` |
| MCP gateway | Arcade (PostHog tools)                       |
| Email       | Resend                                       |
| Testing     | Vitest, Testing Library, MSW, Playwright     |
| Package mgr | pnpm                                         |

## Project layout

```
src/
  app/
    api/                  # Route handlers (auth, invites, insights chat)
    dashboard/            # Signed-in landing page
    insights/             # AI insights chat page
    invite/               # /invite/[code] tracked landing
    sign-in, sign-up/     # Auth flows
  components/             # UI, providers, feature components
  lib/
    ai/                   # OpenAI model + system prompt for insights
    arcade/               # MCP client + OAuth provider
    auth/                 # JWT, cookies, session helpers
    db/                   # Drizzle client + schema
    events/               # Typed analytics event taxonomy + server/client capture
    feature-flags/        # PostHog feature flag helpers
    posthog/              # PostHog server + client bootstrap
scripts/seed.ts           # Seeds the photo gallery
docker-compose.yaml       # Postgres for local dev
drizzle.config.ts         # Drizzle Kit config
```

## Prerequisites

- **Node.js 20+**
- **pnpm** (this repo uses a pnpm workspace; see `pnpm-workspace.yaml`)
- **Docker** (for the local Postgres container)
- Accounts / API keys for the integrations you want to enable:
  - [OpenAI](https://platform.openai.com) — required for the `/insights` chat
  - [PostHog](https://posthog.com) — required if you want analytics captured and queryable
  - [Arcade](https://app.arcade.dev/mcp-gateways) — required for the insights agent to call PostHog tools
  - [Resend](https://resend.com) — required to send real invite emails

All integrations are optional for a basic run — leave their keys blank and the related features will no-op gracefully.

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example and fill in what you need:

```bash
cp .env.example .env
```

Key variables (see `.env.example` for the full list):

| Variable                                               | Purpose                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`                                         | Postgres connection string. Defaults match the Docker service.                      |
| `JWT_SECRET`                                           | 32+ random chars used to sign session JWTs. **Required.**                           |
| `NEXT_PUBLIC_APP_URL`                                  | Public base URL (used for invite links and email). `http://localhost:3000` locally. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL`                 | Send invite emails via Resend.                                                      |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Client-side PostHog. Leave blank to disable.                                        |
| `POSTHOG_KEY`                                          | Optional server-only key; falls back to the public key if unset.                    |
| `ARCADE_GATEWAY_URL`                                   | Your Arcade MCP Gateway URL (where PostHog tools are exposed).                      |
| `ARCADE_API_KEY`                                       | Optional, only needed if you enable Arcade's custom user verifier.                  |
| `OPENAI_API_KEY`                                       | Powers the `/insights` chat agent.                                                  |

Generate a strong JWT secret with:

```bash
openssl rand -base64 48
```

### 3. Start Postgres, apply schema, seed

The `db:setup` script chains everything:

```bash
pnpm db:setup
```

Under the hood it runs:

- `pnpm db:start` — boots the `user-tracker-db` Postgres container (port **5454** on the host, to avoid clashing with other services).
- `pnpm db:push` — pushes the Drizzle schema from `src/lib/db/schema.ts` to the database.
- `pnpm db:seed` — inserts two demo photos so the gallery isn't empty.

You can run any step individually. To stop the database later: `pnpm db:stop` (keeps the volume) or `pnpm db:down` (removes the container).

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account at `/sign-up`, and land on the dashboard. The navbar links to `/insights` once you're signed in.

## Using the Insights agent

The `/insights` page connects to your Arcade MCP Gateway and lets the model call **read-only** PostHog tools (`Posthog.RunQuery`, `Posthog.GetTrend`, `Posthog.GetFunnel`, `Posthog.GetRetention`, etc). Mutation-style tools are filtered out in `src/lib/arcade/client.ts` — the chat cannot create, update, or delete anything.

To enable it:

1. Create a gateway at <https://app.arcade.dev/mcp-gateways> and add the PostHog toolkit to it.
2. Set `ARCADE_GATEWAY_URL` to the gateway URL.
3. Set `OPENAI_API_KEY`.
4. Sign in to the app and open `/insights`. On the first tool call you may be prompted to authorize PostHog — follow the URL, then retry the question.

The system prompt lives at `src/lib/ai/insights-prompt.md` — edit it to change the agent's behavior.

## Analytics model

All events are defined once, with TypeScript, in `src/lib/events/types.ts`. Capture them through the helpers in `src/lib/events/track-client.ts` (browser) or `src/lib/events/track-server.ts` (server). This gives you a single source of truth for event names and property shapes, and makes renames a compile-time concern.

## Testing

```bash
pnpm test          # run unit tests once
pnpm test:watch    # iterate locally
```

Vitest config is in `vitest.config.ts`. Tests colocate next to source (e.g. `src/lib/auth/jwt.test.ts`, `src/app/api/auth/sign-in.test.ts`).

## Troubleshooting

- **`DATABASE_URL` errors on startup** — make sure Postgres is running (`pnpm db:start`) and that your `.env` URL matches port `5454`.
- **`JWT_SECRET` too short** — must be at least 32 characters.
- **Insights chat says "no PostHog tools available"** — add the PostHog toolkit to your Arcade Gateway and double-check `ARCADE_GATEWAY_URL`.
- **Invite emails don't arrive** — set `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`. Without them, the invite endpoint will no-op.

## License

Private / unlicensed — add one before publishing.
