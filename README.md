# Na-Flow

Na-Flow is the Matatu Fleet Intelligence System (MFIS): a real-time fleet operations platform for 52 Kenyan matatus.

## Apps

- `apps/api` - Fastify API with Prisma, JWT-ready auth scaffolding, telemetry ingestion logic, and REST routes.
- `apps/dashboard` - React dashboard shell styled after the provided Figma site.
- `apps/driver-app` - placeholder for the Expo driver app.

## Packages

- `packages/shared-types` - shared TypeScript domain contracts.
- `packages/shared-utils` - currency, date, scoring, and fare split utilities.

## Local Start

```bash
corepack pnpm install
cp .env.example .env
docker compose -f infrastructure/docker-compose.yml up -d
corepack pnpm dev
```

Open the dashboard at `http://localhost:5173`.

Demo login:

- Email: `admin@na-flow.local`
- Password: `Admin@12345`

The dashboard talks to the API at `http://localhost:3000/api/v1` by default. To point it elsewhere, set `VITE_API_URL`.

## Database

This project is configured through `DATABASE_URL`. For Neon, keep the real connection string in `.env` and `apps/api/.env`; `.env.example` intentionally uses a placeholder.

After changing Prisma models:

```bash
corepack pnpm --dir apps/api exec prisma db push
corepack pnpm --dir apps/api exec prisma generate
corepack pnpm --dir apps/api exec tsx prisma/seed.ts
```

Seeded accounts:

- Admin: `admin@na-flow.local` / `Admin@12345`
- Fleet marshal: `marshal@na-flow.local` / `Marshal@12345`
- Driver: `driver@na-flow.local` / `Driver@12345`

Admins can create driver accounts from the Drivers screen. Driver passwords are admin-managed and drivers cannot reset/change them.

Phase 1 focuses on the database model, API foundation, live fleet dashboard shell, and business logic helpers. Payment provider calls, video streaming, and mobile app implementation are intentionally stubbed for later phases.
