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
| `tournaments` | DONE | Tournament CRUD, team management, seed scripts, API-Football ready |
| `groups` | DONE | Full CRUD, invite codes, member management, cross-device handling, conditional hard-delete |
| `matches` | DONE | CRUD, filters (tournamentId, phase, status, date, groupLetter), score updates, real-time events |
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

> **Note**: Instagram OAuth was evaluated and discarded (API deprecated late 2024 for new consumer apps). Only Google + Apple are supported.

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
- **Mobile**: `auth-store.ts` stores `UserDto` (which includes `plan: PlanDto`). The groups list screen counts groups where `createdBy === userId` from cache and disables the create button when `maxGroupsCreated` is reached (shows an alert explaining the limit). Modals read `plan.maxMembersPerGroup` from the store to cap the maxMembers stepper.

Backend still validates as defense-in-depth (PlansService enforcement), but the UI prevents bad inputs before they reach the API. Error messages from the backend are shown without HTTP status codes for a user-friendly experience.

### PlansService Methods

| Method | Used by | What it checks |
|--------|---------|----------------|
| `enforceCanCreateGroup(userId)` | `GroupsService.create` | Active groups created (where user is still a member) < plan.maxGroupsCreated |
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

**Conditional delete**: When an admin deletes a group, the system checks for existing predictions or bonus predictions. Groups **without data are hard-deleted** (physically removed from the database — cascade removes members and tournaments). Groups **with prediction data are archived** (soft-deleted via `isActive: false`) to preserve historical records. The API returns `{ action: 'deleted' | 'archived' }` so the client can display the appropriate message. The same logic applies when the last member leaves a group.

**Cache cleanup on delete/leave**: When a group is deleted or a user leaves, the mutation hooks (`useDeleteGroup`, `useLeaveGroup`) use `onMutate` to `cancelQueries` + `removeQueries` for the group's detail, members, and tournaments queries **before** the API call fires. This is synchronous and eliminates the race condition where Expo Router's Stack keeps the detail screen mounted during navigation transitions. As defense-in-depth, the detail screen also sets an `isGroupRemoved` flag that disables queries via the `enabled` parameter, and the global query client skips retries for 4xx errors (404, 403, etc.) since they indicate permanent failures.

**Cross-device group removal**: When a member is viewing a group that was deleted by the admin from another device (or when the member was expelled), the detail screen detects the 404/403 error via a `useEffect`, shows an Alert explaining the situation, and auto-navigates to the groups list. A `useRef` flag prevents the Alert from firing multiple times.

**maxMembers update**: Admins can change a group's `maxMembers` via the update endpoint. The value is validated against (1) the creator's plan limit and (2) the current active member count — it cannot be set below the number of existing members.

## Tournaments Module

### Backend

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tournaments` | No | List with optional `status`/`type` filters |
| GET | `/tournaments/:slug` | No | Detail by slug (includes phases, bonus types, team count) |
| POST/PATCH/DELETE | `/tournaments(/:id)` | Yes | CRUD (not exposed in mobile — tournaments come from seeds/automation) |
| GET | `/tournaments/:id/teams` | No | Team list with group assignments |
| GET | `/matches` | No | List with filters: `tournamentId`, `phase`, `status`, `date`, `groupLetter` |
| GET | `/matches/upcoming` | No | Upcoming scheduled matches |
| GET | `/matches/live` | No | Live matches (30s refetch on mobile) |
| PATCH | `/matches/:id/score` | Yes | Score update with real-time Socket.IO events |

### Mobile Screens

- **Tournament list** (`tournaments/index.tsx`): All tournaments with status indicators, pull-to-refresh
- **Tournament detail** (`tournaments/[slug].tsx`): Dynamic tabs by phase (Próximos, Grupos, R32, 8vos, 4tos, Semis, 3°/Final) + group letter sub-filter (A-L) for group stage

### Components

- **MatchCard** (`components/matches/match-card.tsx`): Displays match with teams, scores, date/time, venue, phase. Handles 5 states: `SCHEDULED`, `LIVE`, `FINISHED`, `POSTPONED`, `CANCELLED`
- **match-helpers** (`utils/match-helpers.ts`): Spanish date formatting, label dictionaries (phases, types, statuses), `groupMatchesByDate()` for SectionList rendering

### Group Integration

- **CreateGroupModal**: Multi-select tournament picker during group creation
- **AddTournamentModal**: Add tournaments to existing groups (respects plan limits)
- **Product decision**: No UI for create/edit/delete tournaments — all comes from seeds or automation

### Tournament Context: Neutral vs Interactive

- **Tab Torneos → Torneo**: Neutral reference — fixture, results, standings. No predictions shown. Includes a "Mis Grupos" section listing the user's groups that are playing this tournament, linking back to the group for prediction context.
- **Grupo → Torneo**: Interactive context — fixture + predictions + leaderboard. The group provides the context for which predictions to show/make.

This avoids the "which group's predictions?" ambiguity when a user participates in multiple groups with the same tournament.

### Remove Tournament from Group

- **Who**: Admin only
- **Rules**: Blocked if tournament `IN_PROGRESS`/`LIVE`/`FINISHED`. Confirmation if predictions exist. Free removal if `UPCOMING` with no predictions.
- **Data cleanup**: Removing a tournament deletes ALL predictions and bonus predictions for that group+tournament in a single transaction. This is irreversible.
- **Re-add behavior**: If a tournament is removed and later re-added, it starts fresh — no historical predictions are recovered. Users make new predictions from scratch.
- **Safety**: Only allowed for `DRAFT`/`UPCOMING` tournaments, so no real points or leaderboard data is ever lost.

## Dual-Stack Navigation Pattern

Tournament detail is accessible from two tab contexts (Groups and Tournaments). To ensure "back" returns to the correct origin:

```
Tournaments tab:  tournaments/index → tournaments/[slug] → back → tournaments/index ✓
Groups tab:       groups/[id] → groups/tournament/[slug] → back → groups/[id] ✓
```

`groups/tournament/[slug].tsx` re-exports the component from `tournaments/[slug].tsx`. Navigation from group detail uses the groups-stack route (`/(tabs)/groups/tournament/${slug}`) to stay within the Groups stack. This is the standard Expo Router pattern for hub-and-spoke navigation where a detail screen is reachable from multiple parent contexts.

## Critical Rules: NativeWind Styles

### The Golden Rule: NEVER mix `style` and `className`

On iOS with NativeWind v4, the `style` prop and `className` prop resolve at different times. If you put both on the same React Native element, iOS can render invisible content on the first paint. The content may appear after a hot-reload or navigation, but **the first render will be broken**.

```tsx
// BAD — content invisible on iOS first render
<View style={{ flex: 1 }} className="bg-white p-4">
  <Text>This may be invisible</Text>
</View>

// GOOD — separate into two elements
<View style={{ flex: 1 }}>
  <View className="bg-white p-4">
    <Text>Always visible</Text>
  </View>
</View>
```

**Exception**: Components registered with `cssInterop` (like `LinearGradient`) can safely use both `style` and `className` because the interop layer unifies the resolution timing.

### When to use `style` vs `className`

| Use `style` (StyleSheet) | Use `className` (NativeWind) |
|--------------------------|------------------------------|
| Animated values | Static layout/spacing |
| Dynamic values from JS (e.g., `{ height: scrollY }`) | Colors, backgrounds |
| Platform-specific overrides | Typography |
| Navigation bar tints, StatusBar | Responsive variants |

### `StyleSheet.create` placement

Always define `StyleSheet.create()` at **module scope** (outside the component function). If helper components outside the file reference the styles, and the StyleSheet is inside the component body, you get a `ReferenceError` because `const` doesn't hoist.

```tsx
// BAD — ReferenceError if RoleBadge is defined outside GroupDetailScreen
function GroupDetailScreen() {
  const styles = StyleSheet.create({ badge: { ... } });
  // ...
}

// GOOD — always at module scope
const styles = StyleSheet.create({ badge: { ... } });

function GroupDetailScreen() {
  // ...
}
```

## Critical Rules: TanStack Query Mutations (Delete/Leave Pattern)

### The 404 Refetch Problem

When a mutation deletes a resource (group, member, etc.) and the detail screen is still mounted (Expo Router Stack keeps it alive during navigation transitions), TanStack Query will refetch the deleted resource and get a 404. This causes a brief error flash before navigation completes.

### The Definitive Solution (Defense in Depth)

These four layers work together. All four are required:

#### Layer 1: Flag BEFORE mutate (same event handler tick)

```tsx
const [isGroupRemoved, setIsGroupRemoved] = useState(false);

function handleDelete() {
  setIsGroupRemoved(true);  // BEFORE mutate — same tick
  deleteGroupMutation.mutate(groupId);
}
```

**Why before**: React batches state updates. If you set the flag inside `onSuccess`, the query observers fire before the flag takes effect, causing a 404 refetch. Setting it before `mutate()` ensures React processes the flag in the same batch.

**Revert on non-404 error**: In `onError`, check if the error is NOT a 404/403 and revert `setIsGroupRemoved(false)`.

#### Layer 2: Disable queries with `enabled`

```tsx
const { data: group } = useGroup(id, !isGroupRemoved);
const { data: members } = useGroupMembers(id, !isGroupRemoved);
```

When `isGroupRemoved` is true, all queries are disabled. Show `<LoadingScreen />` instead of the detail UI. This prevents the green error flash.

#### Layer 3: Cancel and remove queries in mutation hooks

```tsx
// onMutate (synchronous, before API call)
onMutate: async (groupId) => {
  await qc.cancelQueries({ queryKey: queryKeys.groups.detail(groupId) });
  await qc.cancelQueries({ queryKey: queryKeys.groups.members(groupId) });
  await qc.cancelQueries({ queryKey: queryKeys.groups.tournaments(groupId) });
},

// onSuccess (after API returns)
onSuccess: (_, groupId) => {
  qc.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
  qc.removeQueries({ queryKey: queryKeys.groups.members(groupId) });
  qc.removeQueries({ queryKey: queryKeys.groups.tournaments(groupId) });
  qc.invalidateQueries({ queryKey: queryKeys.groups.all });
},
```

**Why `cancelQueries` in `onMutate` and `removeQueries` in `onSuccess`**: Using `removeQueries` in `onMutate` doesn't work when `useQuery` hooks are still mounted with `enabled=true` — TanStack Query re-creates the query immediately because the observer is still alive. Cancel first, remove after.

#### Layer 4: Global smart retry (skip 4xx)

```tsx
// query-client.ts
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status && NON_RETRYABLE_STATUSES.has(status)) return false;
        return failureCount < 3;
      },
    },
  },
});
```

4xx errors are permanent failures — the resource doesn't exist or the user doesn't have access. Retrying wastes requests and battery. Only 5xx and network errors are transient.

### Navigate Immediately — No Intermediate Alerts

After delete/leave, navigate to the groups list **immediately** in `onSuccess`. Do NOT show an intermediate `Alert.alert("Listo")` before navigation — this keeps the screen mounted longer and gives TanStack Query more time to refetch the deleted resource.

```tsx
// BAD — Alert keeps screen mounted, causes 404 refetches
onSuccess: () => {
  Alert.alert('Listo', 'Grupo eliminado', [
    { text: 'OK', onPress: () => router.replace('/(tabs)/groups') }
  ]);
},

// GOOD — navigate immediately
onSuccess: () => {
  router.replace('/(tabs)/groups');
},
```

### Query Key Structure: Avoid Prefix Collisions

```tsx
// BAD — 'groups' is a prefix of ['groups', id]
groups.all = ['groups'];
groups.detail = (id) => ['groups', id];

// GOOD — no prefix collisions
groups.all = ['groups', 'list'];
groups.detail = (id) => ['groups', 'detail', id];
groups.members = (id) => ['groups', 'members', id];
groups.tournaments = (id) => ['groups', 'tournaments', id];
```

`invalidateQueries({ queryKey: ['groups'] })` with prefix matching will cascade into ALL queries that start with `['groups']`. Adding a second segment (`'list'`, `'detail'`) prevents unintended invalidation.

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
