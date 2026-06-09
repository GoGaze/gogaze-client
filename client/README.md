# GoGaze Client

Next.js 15 (App Router, React 19, TypeScript, Tailwind v4) frontend for GoGaze —
media management with real-time control of display devices.

This is one of two repos:

- **`GoGaze/gogaze-client`** (this repo) — the Next.js frontend.
- **`GoGaze/server`** — the Django + Channels backend.

## Prerequisites

- Node.js 20+
- A running GoGaze backend (see the server repo's README) — Django on `:8000`,
  Redis on `:6379`, PostgreSQL, and FFmpeg for transcoding.
- A Firebase project (Email/Password and/or Google auth enabled).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Environment (`.env.local`)

See `.env.example`. Key variables:

| Variable | Purpose |
|---|---|
| `API_BASE_URL` | Server-side URL the Next proxy uses to reach Django |
| `NEXT_PUBLIC_API_URL` | Browser-facing API origin (resolves `/media/` URLs) |
| `NEXT_PUBLIC_WS_URL` | WebSocket base for the display screen |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config |

`NEXT_PUBLIC_*` values are **inlined at build time** — for Docker you must pass
them as `--build-arg`s (the `Dockerfile` and CI already wire this up).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (standalone output) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite |
| `npm run test:coverage` | Tests with coverage |

## Auth model

- Firebase Auth on the client. After sign-in, the ID token is POSTed to
  `/api/auth/session`, which stores it in an **HttpOnly, Secure, SameSite=Strict**
  cookie (never readable by JS).
- Same-origin requests to `/api/*` automatically carry that cookie; the Next
  route handlers forward it to Django as `Authorization: Bearer <token>`.
- Django verifies the token against Google's public keys (no service account
  needed) and enforces `IsAuthenticated` on every endpoint.
- `middleware.ts` checks token expiry at the edge; `AuthGuard` gates client UI.

## Devices & the display screen

1. Register a device on **/devices** — you get a one-time token + a display URL.
2. Open that URL (`/display/<deviceId>?token=...`) on the screen device. It
   connects over WebSocket (token-authenticated) and shows live online status.
3. From **/gallery**, pick an online device to play/stop media on it.

## Docker

```bash
docker build -t gogaze-client \
  --build-arg NEXT_PUBLIC_API_URL=... \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=... \
  .
# or: docker compose up   (see docker-compose*.yml)
```
