# Pichichi - Roadmap

> This document is auto-maintained. Updated as features are implemented.
>
> Last updated: 2026-04-02

## V1 - World Cup 2026

### Completed

- [x] **Project scaffolding** — Monorepo with NestJS API, Next.js web, Expo mobile, shared packages
- [x] **Database schema** — 13 models, multi-tournament ready (Prisma + PostgreSQL)
- [x] **Authentication** — Google OAuth (native SDK) + Apple Sign In (pending Apple Developer Program). Instagram removed (API deprecated for new apps)
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
- [x] **Group creation limit fix** — enforceCanCreateGroup no longer counts groups where the creator has left
- [x] **Tournaments module** — Backend + mobile screens for tournament browsing and group integration
  - Backend: Tournament CRUD, match endpoints with groupLetter filter, seed scripts (World Cup 2026 + test tournaments)
  - Mobile: Tournament list and detail screens, MatchCard component (5 visual states), match-helpers utilities
  - Mobile: AddTournamentModal, CreateGroupModal tournament selection
- [x] **Tournament navigation** — Dual-stack Expo Router pattern for correct back navigation from groups tab vs tournaments tab
- [x] **Tournament removal from groups** — Admin-only action, blocked if tournament is in progress or finished, confirmation prompt if predictions exist
- [x] **Tournament detail: "Mis Grupos" section** — Show user's groups playing this tournament in the standalone tournament detail screen. Tapping a group navigates to group detail where predictions happen. Resolves the "which group's predictions?" ambiguity.
- [x] **Predictions module** — Core game mechanic (backend + mobile)
  - Predict match scores before kickoff
  - Auto-lock at kickoff (5-min buffer, server-side)
  - Reveal other users' predictions after kickoff
  - Auto-calculate points when results arrive (fire-and-forget scoring engine)
  - ScoringService extracted to separate module (breaks circular deps)
  - 50 unit tests covering scoring logic
- [x] **Predictions mobile UI** — 4-tab GroupTournamentScreen
  - Tabs: Pronósticos (upcoming+live), Resultados (finished), Bonus, Ranking
  - Score input modal with +/- stepper
  - Badge states: open, predicted, locked, live, scored
  - Match card with prediction footer
  - Bonus prediction vertical list
  - Leaderboard display
- [x] **Bonus predictions (backend)** — Pre-tournament specials
  - Champion, top scorer, MVP, revelation
  - Lock at tournament start
  - Resolve at tournament end
  - UI upgraded from free text to select dropdowns (see bonus-select feature)
- [x] **Leaderboard module** — Per-group per-tournament rankings
  - Redis-cached with graceful in-memory fallback
  - Raw SQL aggregation for performance
  - Tiebreaker: most exact score predictions, then shared position
- [x] **WebSocket gateway (partial)** — Real-time updates
  - Room: `group:{id}` for leaderboard/prediction reveals
  - Room: `match:{id}` for live score updates
  - Socket.IO events for prediction updates
- [x] **Tournament import script** — CLI to import tournaments from API-Football
  - Flags: --search, --league, --season, --include-players, --dry-run
  - Player and TournamentPlayer models added
  - Clean-db script for full reset
  - Hardcoded seed scripts removed
  - GUIA-ADMIN.md created
- [x] **Bonus select UI** — Bonus predictions now use select dropdowns instead of free text (`33a16e3`, 2026-04-02)
  - Champion/Revelation: team picker from tournament teams
  - Top Scorer/MVP: player picker from tournament players
  - BonusPredictionSelect component with React Hook Form integration
  - Backend: GET /tournaments/:id/teams and GET /tournaments/:id/players endpoints
  - Shared: BonusOptionDto, getTournamentTeams/getTournamentPlayers API client functions
  - TanStack hooks: useTournamentTeams, useTournamentPlayers
- [x] **Toggle tournament script** — Dev tool to toggle tournament status (NOT_STARTED ↔ IN_PROGRESS) for testing predictions lock behavior (`33a16e3`, 2026-04-02)

### Pending

- [ ] **match-data-sync** — Smart Cron + API-Football for automatic live result updates. **IN PROGRESS.**
  - Smart Cron polling: hourly heartbeat + 5-min dynamic intervals when matches are live
  - API-Football integration: batch fixture fetching, rate-limit tracking
  - Match change detection and auto-score updates via `MatchesService.updateScore()`
  - Tournament auto-finish: when all matches complete, tournament status → FINISHED
  - Champion bonus auto-resolve on tournament final
  - `BonusPredictionsService.resolveByKey()` for manual resolution (TOP_SCORER, MVP, REVELATION)
  - Admin API: `POST /match-sync/trigger`, `POST /match-sync/toggle`, `POST /bonus-predictions/resolve`
  - Remaining: controller/module wiring, admin endpoint, tournament auto-finish integration, unit tests, manual verification

- [ ] **EAS development build** — Required for testing real OAuth flows on physical devices

- [ ] **Apple Developer Program membership** — $99/year, required for iOS builds + Apple Sign In

- [ ] **Notifications** — Push + in-app
  - Match reminders (1h before kickoff)
  - Result notifications
  - Prediction deadline alerts
  - Group invite notifications
  - Leaderboard position changes

- [ ] **Admin Panel Web** — Web-based admin interface for tournament and sync management
  - Trigger manual sync and view sync status/logs
  - Toggle sync on/off at runtime
  - Resolve bonus predictions (TOP_SCORER, MVP, REVELATION) via UI
  - Manage tournaments (import, status, configuration)
  - Likely Next.js (web app already exists in monorepo)

- [ ] **Navigation fixes** — Cross-tab state pollution
  - Deep-linking across tabs (tournament → group) may not preserve back stack
  - Fix Expo Router cross-tab navigation edge cases

### Future (post-V1)

- [ ] Copa America support (add tournament, no code changes needed)
- [ ] Champions League support
- [ ] League format support (requires MATCHDAY phase enum)
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
| iOS "Mis Grupos" section in tournament detail | Low | Navigation from standalone tournament detail to group detail may have edge cases on iOS. Deferred. |
| Navigation cross-tab state | Low | Deep-linking across tabs (e.g., tournament → group) may not preserve back stack in all scenarios. Deferred. |

## Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| API-Football squad endpoint returns current roster, not historical | Low | Only affects past tournaments. Current/future tournament imports are accurate. |
| No structured logging (JSON) | Low | Using NestJS built-in Logger. Consider pino for production. |
| No rate limiting on API | Medium | Add before production launch. |
| No health check endpoint | Low | Add `/health` for infrastructure monitoring. |
