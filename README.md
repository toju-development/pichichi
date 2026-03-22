# Pichichi 🏆⚽

Tournament predictions app (prode) for World Cup 2026 and beyond.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| API            | NestJS 11, TypeScript, Prisma ORM   |
| Web            | Next.js 16, React 19, Tailwind CSS 4|
| Mobile         | React Native 0.83, Expo 55          |
| Database       | PostgreSQL 16                       |
| Cache          | Redis 7                             |
| Shared         | `packages/shared` (types, utils, scoring constants) |

## Prerequisites

- **Node.js 22** (see `.nvmrc` — run `nvm use` if you have nvm)
- **Docker & Docker Compose** (for PostgreSQL and Redis)
- **Expo Go** app on your phone (for mobile development)
- **npm** — this monorepo uses npm workspaces. Do not use yarn or pnpm.

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd pichichi
npm install
```

### 2. Environment Setup

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set the values:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://pichichi:pichichi_dev@localhost:5432/pichichi?schema=public` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing JWTs — **change this** | `your-super-secret-jwt-key-change-in-production` |
| `JWT_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `30d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | _(empty — get from Google Cloud Console)_ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | _(empty)_ |
| `APPLE_CLIENT_ID` | Apple Sign-In client ID | _(empty — get from Apple Developer)_ |
| `APPLE_CLIENT_SECRET` | Apple Sign-In client secret | _(empty)_ |
| `PORT` | API port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3001,http://localhost:8081` |
| `FIREBASE_PROJECT_ID` | Firebase project for push notifications | _(empty — optional for local dev)_ |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | _(empty)_ |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | _(empty)_ |

> For local development, the defaults for `DATABASE_URL` and `REDIS_URL` work out of the box with Docker Compose. OAuth and Firebase variables are optional — features that need them will be disabled.

### 3. Start Infrastructure (Docker)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port `5432` (user: `pichichi`, password: `pichichi_dev`, db: `pichichi`)
- **Redis 7** on port `6379`

> If you already have PostgreSQL running natively, you can skip Docker for PG — just make sure the `DATABASE_URL` in `.env` matches your local instance.

### 4. Database Setup

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

- `prisma migrate dev` — creates the database tables and runs all migrations
- `prisma generate` — generates the Prisma Client (typed database access)

### 5. Start the API

```bash
cd apps/api
npm run start:dev
```

- **Swagger docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **API base URL**: `http://localhost:3000/api/v1`

### 6. Start the Web (Landing)

```bash
cd apps/web
npm run dev -- -p 3001
```

- Available at [http://localhost:3001](http://localhost:3001)

### 7. Start the Mobile App

```bash
cd apps/mobile
npx expo start
```

- Scan the QR code with **Expo Go** on your phone
- Or press `i` for iOS Simulator, `a` for Android Emulator

## Project Structure

```
pichichi/
├── apps/
│   ├── api/            # NestJS backend (REST API + WebSockets)
│   ├── web/            # Next.js web app (landing page)
│   └── mobile/         # Expo/React Native mobile app
├── packages/
│   └── shared/         # Shared types, utils, and scoring constants
├── docker-compose.yml  # PostgreSQL + Redis for local dev
└── package.json        # Root — npm workspaces config
```

## API Modules

| Module | Description |
|--------|-------------|
| `auth` | Google/Apple OAuth + JWT (access + refresh tokens) |
| `users` | User profiles and management |
| `tournaments` | Tournament CRUD |
| `groups` | Groups with invite codes and member management |
| `matches` | Match schedules and results |
| `predictions` | User match predictions |
| `bonus-predictions` | Bonus/special predictions |
| `leaderboard` | Scoring and rankings |
| `notifications` | Push notifications (Firebase) |

## Useful Commands

```bash
# From project root (npm workspace shortcuts)
npm run docker:up              # Start PostgreSQL + Redis
npm run docker:down            # Stop containers
npm run prisma:studio          # Visual database browser (opens in browser)
npm run prisma:migrate         # Run pending migrations
npm run prisma:generate        # Regenerate Prisma Client

# From apps/api/
npm run start:dev              # Start API in watch mode
npm run build                  # Build check
npm run test                   # Run unit tests
npm run test:e2e               # Run end-to-end tests
npm run lint                   # Lint + auto-fix

# From apps/api/ (Prisma)
npx prisma migrate dev --name <name>   # Create a new migration
npx prisma studio                      # Visual DB browser
npx prisma db push                     # Push schema without migration (prototyping)

# From apps/web/
npm run dev                    # Start Next.js dev server
npm run build                  # Production build

# From apps/mobile/
npx expo start                 # Start Expo dev server
```
