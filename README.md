# Splitlify

Splitlify is a bill-splitting web app for groups who shop together (for example on Zepto). Upload an invoice, assign each item to the people who used it, and see how much everyone owes — with UPI payment links and QR codes.

## Installation

```bash
npm install
```

## Environment setup

Copy the example env file and fill in values as needed:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL for session storage |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |
| `DATABASE_URL` | No | PostgreSQL URL — future Supabase migration only |

If Redis credentials are not set, sessions are stored in an in-memory fallback (fine for local development, not for production).

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Architecture

```
Pages → Components → lib (business logic) → sessionStore → Redis
```

- **Pages** (`app/`) — routing and composition only
- **Components** (`components/`) — UI, no business logic or Redis access
- **lib/** — typed utilities: split calculation, invoice parsing, UPI links
- **sessionStore.ts** — the only module that reads/writes session data

Session access is URL-based — there is no authentication.

## Future work

**Why Redis and Prisma together?**

- **Redis (now)** — fast, ephemeral session storage keyed by URL session ID. Ideal for the current scaffold and short-lived split sessions.
- **Prisma + PostgreSQL (later)** — durable storage on Supabase for persisted sessions, audit history, and richer queries.

The Prisma schema in `prisma/schema.prisma` and client in `lib/prisma.ts` are set up for a future migration. They are not connected at runtime. When migrating, only `lib/sessionStore.ts` should need to change — swap Redis calls for Prisma queries. Pages, components, and API routes stay the same.

Planned implementation work (marked with `TODO` in code):

- Zepto invoice PDF parsing
- Proportional split calculation
- Payer VPA collection and validation
- Standards-compliant UPI deep links
