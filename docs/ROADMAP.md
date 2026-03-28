# Pichichi - Roadmap

> This document is auto-maintained. Updated as features are implemented.
>
> Last updated: 2026-03-28

## V1 - World Cup 2026

### Completed

- [x] **Project scaffolding** — Monorepo with NestJS API, Next.js web, Expo mobile, shared packages
- [x] **Database schema** — 13 models, multi-tournament ready (Prisma + PostgreSQL)
- [x] **Authentication** — Google OAuth (native SDK) + Apple Sign In (pending Apple Developer Program)
- [x] **JWT token management** — Access (15min) + refresh (30 days) with rotation, stored in SecureStore
- [x] **Dev tooling** — Dev-login endpoint, HTTP request logging, Expo Go support with conditional plugins
- [x] **Landing page** — Next.js web with "Selva Mundialista" visual identity
- [x] **Mobile app shell** — Expo Router with 4 tabs (Inicio, Grupos, Ranking, Perfil), login screen
- [x] **Groups module** — Full-stack: backend + mobile + API client + TanStack hooks
  - Backend: CRUD, invite codes, member management, tournament association
  - Mobile: Groups list screen with create/join modals, group detail screen with members, tournaments, invite code sharing, admin actions
  - API client: All 12 group endpoints wired
  - TanStack hooks: All queries and mutations implemented
- [x] **Plan system** — Per-user plan limits (FREE/PREMIUM)
  - Plan model with typed limit columns (maxGroupsCreated, maxMemberships, maxMembersPerGroup, maxTournamentsPerGroup)
  - Centralized enforcement via PlansService
  - Plan limits enforced on group create, join, member capacity, tournament add, group update
  - API: GET /plans, GET /plans/me
- [x] **Groups module polish** — Functional review + fixes
  - Editable maxMembers (admin only, capped by plan, floor at current member count)
  - Conditional delete: hard-delete if no predictions, archive (soft-delete) if group has data
  - Last member leaving: same logic — hard-delete empty groups, archive groups with predictions
  - joinByCode race condition fixed with Serializable transaction
  - Edit group modal (name, description, maxMembers)
  - Delete/archive group action with user feedback
  - Dead code cleanup (UpdateMemberRoleDto, updateMemberRole)
  - Cache cleanup: removeQueries on delete/leave to prevent 404 refetches
  - retry: false on all mutations

### In Progress

- [ ] **Tournaments module** — CRUD + API-Football integration *(next up)*
  - Seed World Cup 2026 fixture (all matches, teams, phases)
  - Tournament detail screen (groups, schedule, standings)

### Pending

- [ ] **Matches module** — Schedule display + result sync
  - Match list by date / phase
  - Smart cron for automatic result updates via API-Football
  - Match status state machine (SCHEDULED → LIVE → FINISHED)

- [ ] **Predictions module** — Core game mechanic
  - Predict match scores (before kickoff)
  - Auto-lock at kickoff (server-side)
  - Reveal other users' predictions after kickoff
  - Auto-calculate points when results arrive

- [ ] **Bonus predictions** — Pre-tournament specials
  - Champion, top scorer, MVP, revelation
  - Lock at tournament start
  - Resolve at tournament end

- [ ] **Leaderboard module** — Rankings
  - Per-group per-tournament rankings
  - Redis-cached for performance
  - Real-time updates via WebSocket

- [ ] **Notifications** — Push + in-app
  - Match reminders (1h before kickoff)
  - Result notifications
  - Prediction deadline alerts
  - Group invite notifications
  - Leaderboard position changes

- [ ] **WebSocket gateway** — Real-time updates
  - Room: `group:{id}` for leaderboard/prediction reveals
  - Room: `match:{id}` for live score updates

### Future (post-V1)

- [ ] Copa America support (add tournament, no code changes needed)
- [ ] Champions League support
- [ ] League format support (requires MATCHDAY phase enum)
- [ ] Apple Developer Program ($99/year) — required for iOS builds + Apple Sign In
- [ ] Production deployment (API + database + Redis)
- [ ] Google OAuth consent screen: "Publish App"
- [ ] App Store / Play Store submission
- [ ] **Stripe payments** — Premium plan billing
  - Stripe Checkout for subscription
  - Webhook to upgrade/downgrade user plan
  - Architecture ready: planId FK on User, Plan model seeded with limits
- [ ] Social features (group chat, activity feed)

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| iOS vs Android style inconsistency on home screen "Ver proximos partidos" button | Low | Button renders small/left-aligned on iOS, full-width on Android. Fix when polishing UI components. |
| `app.controller.spec.ts` has stale `getHello` test | Low | Boilerplate NestJS test, unrelated to app functionality. |
| Apple Sign In not testable | Medium | Requires Apple Developer Program ($99/year). Google OAuth verified and working. |

## Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| Hardcoded scoring values in predictions.service.ts | Low | All tournaments share same points (5/3/1/0). Make configurable per tournament if needed later. |
| No structured logging (JSON) | Low | Using NestJS built-in Logger. Consider pino for production. |
| No rate limiting on API | Medium | Add before production launch. |
| No health check endpoint | Low | Add `/health` for infrastructure monitoring. |
