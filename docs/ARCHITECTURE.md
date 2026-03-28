# Pichichi - Architecture

## Overview

Pichichi is a multi-tournament football predictions app (prode). Users create groups, invite friends, and predict match results. Points are calculated automatically when matches finish.

## System Architecture

```
Mobile App (Expo)          Web (Next.js)
       \                      /
        \                    /
     REST API (NestJS) ← JWT Auth
            |
     ┌──────┼──────┐
     │      │      │
 PostgreSQL Redis  Firebase (FCM)
                      │
                  Push Notifications

External:
  API-Football ──(cron)──> NestJS ──> PostgreSQL
```

## Monorepo Structure

```
pichichi/
├── apps/
│   ├── api/              # NestJS backend (REST API + WebSockets)
│   │   ├── src/
│   │   │   ├── modules/  # Domain modules (auth, groups, matches, etc.)
│   │   │   ├── common/   # Guards, interceptors, filters, pipes
│   │   │   └── config/   # Environment validation
│   │   └── prisma/       # Schema + migrations + seeds
│   ├── web/              # Next.js landing page
│   └── mobile/           # Expo React Native app
│       ├── app/          # Expo Router (file-based routing)
│       │   ├── (auth)/   # Auth screens (login)
│       │   └── (tabs)/   # Main app (home, groups, ranking, profile)
│       └── src/
│           ├── api/      # Axios client + API functions
│           ├── hooks/    # TanStack Query mutations/queries
│           └── stores/   # Zustand stores (auth)
├── packages/
│   └── shared/           # Shared types, DTOs, scoring constants
└── docs/                 # This documentation
```

## Backend Modules

| Module | Status | Description |
|--------|--------|-------------|
| `auth` | DONE | Google/Apple OAuth + JWT (access + refresh tokens) + dev-login bypass |
| `users` | DONE | User profiles and management |
| `tournaments` | SCAFFOLDED | Tournament CRUD (multi-tournament ready) |
| `groups` | SCAFFOLDED | Groups with invite codes and member management |
| `matches` | SCAFFOLDED | Match schedules, results, API-Football sync |
| `predictions` | SCAFFOLDED | User match predictions + auto-scoring |
| `bonus-predictions` | SCAFFOLDED | Pre-tournament special predictions |
| `leaderboard` | SCAFFOLDED | Scoring and rankings (Redis-cached) |
| `notifications` | SCAFFOLDED | Push notifications (Firebase FCM) |

> "SCAFFOLDED" means the NestJS module exists with controller/service/DTOs but business logic is not yet implemented.

## Authentication Flow

```
1. User taps "Sign in with Google"
2. Native SDK (Google Play Services / Apple AuthServices) handles OAuth
3. Provider returns idToken
4. Mobile sends idToken to POST /auth/google (or /auth/apple)
5. Backend verifies idToken with Google/Apple
6. Backend creates or finds user in DB
7. Backend generates JWT access token (15min) + refresh token (30 days)
8. Mobile stores tokens in SecureStore
9. All subsequent API calls include Authorization: Bearer <accessToken>
10. On 401, mobile silently refreshes via POST /auth/refresh
```

### Dev Login (development only)

```
POST /auth/dev-login { email: "user@example.com" }
```

Bypasses OAuth verification. Protected by DevOnlyGuard (NODE_ENV !== production). Returns same response as Google/Apple login. Allows rapid iteration in Expo Go without native builds.

## Data Model

### Core Relationships

```
User ──< GroupMember >── Group ──< GroupTournament >── Tournament
                                                          │
User ──< Prediction >── Match ─────────────────────────────┘
                    └── Group                              │
                                                           │
                                              TournamentPhase (multipliers)
                                              TournamentTeam (group letters)
                                              TournamentBonusType (bonus questions)
```

### Key Design Decisions

- **Predictions are per [user, match, group]**: Same user can predict differently in different groups for the same match
- **Multi-tournament via GroupTournament**: A group can participate in multiple tournaments simultaneously
- **Phase multipliers are per tournament**: Each tournament defines its own multiplier per phase (e.g., group=x1, final=x3)
- **Bonus predictions are per tournament**: Each tournament defines its own bonus types (champion, top scorer, etc.)
- **Teams are shared**: A team entity is reused across tournaments via TournamentTeam join table
- **Match placeholders**: Knockout matches can have `homeTeamPlaceholder: "Winner Group A"` before teams are determined

## Development Workflow

### Running in Expo Go (fast iteration, no OAuth)

```bash
cd apps/mobile && EXPO_USE_EXPO_GO=true npx expo start
```

- Uses Dev Login button (bypasses Google Sign-In)
- Works on both iOS Simulator and Android Emulator
- `app.config.ts` conditionally excludes native plugins

### Running with Dev Client (full features, OAuth)

```bash
cd apps/mobile && npx expo start --dev-client
```

- Requires EAS build: `eas build --profile development --platform android|ios`
- Google Sign-In works via native SDK

### Platform URL Resolution

The API client (`src/api/client.ts`) auto-resolves `localhost` to `10.0.2.2` on Android. Set `.env` to `localhost` — it works on both platforms.

| Platform | .env says | Resolves to |
|----------|-----------|-------------|
| iOS Simulator | localhost | localhost |
| Android Emulator | localhost | 10.0.2.2 |
| Production | api.domain.com | api.domain.com |
