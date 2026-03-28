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
| `plans` | DONE | Subscription plans with typed limit columns + enforcement service |
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
- **Plan limits are per user**: The `Plan` model defines limits; the `User.planId` FK references the active plan

## Plan System

### Architecture Decision

Plan limits are stored as **typed columns** in the `Plan` table (not JSON, not key-value). This gives:

- **Type-safety end-to-end**: Prisma generates typed fields → PlanService exposes them → TypeScript validates at compile time
- **Single query**: `include: { plan: true }` on user gives all limits — zero extra queries
- **DB-level validation**: Each column has a type (`Int`) and a `DEFAULT` — impossible to store invalid data
- **Easy to extend**: Adding a new limit = one Prisma migration with `ALTER TABLE ADD COLUMN ... DEFAULT value`

### Database Schema

```
Plan (plans)
├── id (UUID PK)
├── name (VARCHAR 50, UNIQUE) — "FREE", "PREMIUM"
├── maxGroupsCreated (INT, default 3)
├── maxMemberships (INT, default 5)
├── maxMembersPerGroup (INT, default 10)
├── maxTournamentsPerGroup (INT, default 1)
├── isActive (BOOL, default true)
├── createdAt, updatedAt
│
User.planId (UUID FK → Plan.id, NOT NULL, default FREE plan UUID)
```

### Seeded Plans

| Plan | maxGroupsCreated | maxMemberships | maxMembersPerGroup | maxTournamentsPerGroup |
|------|:---:|:---:|:---:|:---:|
| FREE | 3 | 5 | 10 | 2 |
| PREMIUM | 999999 | 999999 | 50 | 999999 |

Plan UUIDs are deterministic (hardcoded in migration) so they can be referenced safely:
- FREE: `00000000-0000-4000-a000-000000000001`
- PREMIUM: `00000000-0000-4000-a000-000000000002`

### Enforcement Flow

```
User action (create group, join, add tournament)
    │
    ▼
GroupsService calls PlansService.enforce*()
    │
    ▼
PlansService loads user.plan (single query)
    │
    ▼
Counts current usage (e.g., groups created)
    │
    ▼
usage >= plan.limit? → ForbiddenException with descriptive message
                      → Otherwise: proceed
```

### Plan in Auth Flow

The user's plan data is included in **every auth response** and the `/users/me` endpoint. This allows the mobile app to know plan limits upfront (e.g., `maxMembersPerGroup`) and enforce them in the UI without waiting for backend validation errors.

- **Login (Google/Apple/Dev)**: `AuthService.findOrCreateUser` returns `UserWithPlan` → `buildAuthResponse` maps it via `AuthService.toUserDto()`
- **Token refresh**: `refreshTokens` queries user with `include: { plan: true }`
- **GET /users/me**: `UsersService.findById` includes plan → `UsersController` maps via `AuthService.toUserDto()`
- **Mobile**: `auth-store.ts` stores `UserDto` (which includes `plan: PlanDto`). Modals read `plan.maxMembersPerGroup` from the store to cap the maxMembers input.

Backend still validates as defense-in-depth (PlansService enforcement), but the UI prevents bad inputs before they reach the API.

### PlansService Methods

| Method | Used by | What it checks |
|--------|---------|----------------|
| `enforceCanCreateGroup(userId)` | `GroupsService.create` | Groups created < plan.maxGroupsCreated |
| `enforceCanJoinGroup(userId)` | `GroupsService.joinByCode` | Active memberships < plan.maxMemberships |
| `enforceGroupMemberCapacity(groupId, creatorId)` | `GroupsService.joinByCode` | Active members < min(group.maxMembers, plan.maxMembersPerGroup) |
| `getMaxMembersPerGroup(userId)` | `GroupsService.create`, `GroupsService.update` | Caps maxMembers at plan limit |
| `enforceCanAddTournament(groupId, creatorId)` | `GroupsService.addTournament` | Tournaments in group < plan.maxTournamentsPerGroup |
| `getUserPlan(userId)` | `PlansController.getMyPlan` | Returns full plan object |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/plans` | List all available plans (authenticated) |
| GET | `/plans/me` | Get current user's plan with all limits |

### Adding a New Limit (Recipe)

1. **Prisma schema**: Add a column to `Plan` model with `@default(value)`
2. **Migration**: `npx prisma migrate dev --name add_max_xyz_limit`
3. **PlanService**: Add an `enforceCanXyz()` method
4. **Consumer service**: Call `this.plansService.enforceCanXyz(userId)` before the action
5. **Shared types**: Add the field to `PlanDto` in `packages/shared/src/types/dto.ts`
6. **Update seeded values**: SQL `UPDATE plans SET max_xyz = ... WHERE name = 'FREE'`

### Changing Limits (No Deploy Required)

Since limits live in the database, you can change them with a simple SQL update:

```sql
-- Give FREE users 5 groups instead of 3
UPDATE plans SET max_groups_created = 5 WHERE name = 'FREE';

-- Upgrade a specific user to PREMIUM
UPDATE users SET plan_id = '00000000-0000-4000-a000-000000000002' WHERE email = 'user@example.com';
```

### Future: Stripe Integration

When Stripe is added, the Plan model will gain a `stripePriceId` column. A webhook handler will update `user.planId` when a subscription is created/cancelled. The enforcement logic doesn't change — it only cares about `user.plan.*` values.

### Groups Module: Concurrency & Data Safety

**joinByCode race condition**: The entire `joinByCode` flow (capacity check + member insert) is wrapped in a Prisma interactive transaction with `Serializable` isolation level. This prevents two concurrent join requests from exceeding the group's member capacity.

**Conditional delete**: When an admin deletes a group, the system checks for existing predictions or bonus predictions. If the group has data, it is archived (soft-deleted) rather than destroyed. The API returns `{ action: 'deleted' | 'archived' }` so the client can display the appropriate message.

**maxMembers update**: Admins can change a group's `maxMembers` via the update endpoint. The value is validated against (1) the creator's plan limit and (2) the current active member count — it cannot be set below the number of existing members.

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
