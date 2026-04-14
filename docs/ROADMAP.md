# Pichichi - Roadmap

> This document is auto-maintained. Updated as features are implemented.
>
> Last updated: 2026-04-14

## V1 - World Cup 2026

### ✅ Fase 1 — Core Features — COMPLETA

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
- [x] **WebSocket gateway** — Real-time updates
  - Room: `group:{id}` for leaderboard/prediction reveals
  - Room: `match:{id}` for live score updates
  - Socket.IO client in mobile (match:score_update, match:status_update, leaderboard:update, prediction:points_calculated)
- [x] **Tournament import script** — CLI to import tournaments from API-Football
  - Flags: --search, --league, --season, --include-players, --dry-run
  - Player and TournamentPlayer models added
  - Clean-db script for full reset
  - Hardcoded seed scripts removed
  - GUIA-ADMIN.md created
- [x] **Bonus select UI** — Bonus predictions now use select dropdowns instead of free text
  - Champion/Revelation: team picker from tournament teams
  - Top Scorer/MVP: player picker from tournament players
  - BonusPredictionSelect component with React Hook Form integration
  - Backend: GET /tournaments/:id/teams and GET /tournaments/:id/players endpoints
  - Shared: BonusOptionDto, getTournamentTeams/getTournamentPlayers API client functions
  - TanStack hooks: useTournamentTeams, useTournamentPlayers
- [x] **match-data-sync** — Smart Cron + API-Football for automatic live result updates
  - Smart Cron polling: hourly heartbeat + 5-min dynamic intervals when matches are live
  - API-Football integration: batch fixture fetching, rate-limit tracking
  - Match change detection and auto-score updates via `MatchesService.updateScore()`
  - Tournament auto-finish: when all matches complete, tournament status → FINISHED
  - Champion bonus auto-resolve on tournament final
  - `BonusPredictionsService.resolveByKey()` for manual resolution (TOP_SCORER, MVP, REVELATION)
  - Admin API: `POST /match-sync/trigger`, `POST /match-sync/toggle`, `POST /bonus-predictions/resolve`
- [x] **Home screen dashboard** — Real user data (stats, próximos partidos, accesos rápidos)
- [x] **In-app notifications** — Triggers + bell badge (sendPush stub, no FCM yet)
- [x] **Global ranking** — Deduplicated leaderboard, podium top-3, infinite scroll, sticky user bar

### ✅ Fase 2 — UI/Navegación — COMPLETA

- [x] **Home screen redesign** — "Selva Mundialista" visual language
- [x] **Groups list redesign** — New card layout, status pills
- [x] **Create/Join Group Modals** — Polished forms
- [x] **Group Detail redesign** — Members, tournaments, admin actions
- [x] **Edit Group Modal** — Name, description, maxMembers
- [x] **Add Tournament Modal** — Tournament picker
- [x] **Torneos Screen redesign** — Tournament logos, type/status pills, unified green accent
- [x] **Tournament Detail (standalone)** — "Mis Grupos" section
- [x] **Torneo-Grupo Tabs redesign** — Pronósticos, Resultados, Bonus, Ranking tabs
- [x] **Prediction Modal redesign** — Score stepper, badge states
- [x] **Profile screen redesign** — Avatar, settings rows
- [x] **Back Button Unification** — ScreenHeader onBack pattern across all screens
- [x] **Match Detail Modal** — API-Football widget via WebView proxy
- [x] **Empty state polish** — Lucide icons, no emoji
- [x] **Social reveal** — GroupPredictionsSheet: group name, team logos (TeamAvatar), "(Vos)" highlight
- [x] **Landing page SEO** — robots.ts, sitemap.ts, manifest.ts, og:image, JSON-LD, FAQ page

### ✅ Fase 3 — Pre-Launch Polish — COMPLETA

- [x] **Onboarding flow** — First-time user experience guided flow
- [x] **Error boundaries / offline handling** — AppErrorBoundary, SectionErrorBoundary, offline banner
- [x] **Apple Sign In** — Backend verification code implemented (UI pendiente de Apple Developer Account)
- [x] **Profile screen** — Redesigned with avatar, settings rows
- [x] **Landing page polish** — SEO completo, copy mejorado, og:image, FAQ page, logo, icons

### 🔲 Fase 4A — Deploy Android (PRÓXIMO PASO)

- [ ] **Verificar env vars** — Mobile app apuntando a `api.pichichi.app` en producción
- [ ] **EAS Build Android** — Configurar production profile, generar `.aab`
- [ ] **Test en dispositivo físico** — Contra backend de producción (`api.pichichi.app`)
- [ ] **Google Play Console** — $25 única vez, cuenta, store listing, publicar

> **Infraestructura ya deployada:** Backend en Railway (`api.pichichi.app`), landing en Vercel (`pichichi.app`), Cloudflare DNS.

### 🔲 Fase 4B — Deploy iOS (BLOQUEADO)

- [ ] **Apple Developer Account** — $99/yr — **no comprada todavía**
- [ ] **EAS Build iOS** — Una vez comprada la cuenta: generar `.ipa`
- [ ] **App Store submission** — Store listing, review process

### 🔲 Fase 5 — Monetización

- [ ] **Stripe integration** — PREMIUM plan checkout, webhooks, subscription management (FREE/PREMIUM model already in DB)

### 🔲 Detalles menores pendientes

- [ ] URLs reales App Store / Google Play en `cta-banner.tsx` (cuando existan)
- [ ] URL real `@pichichi_app` en footer Twitter/X (cuando exista la cuenta)

### 🗂 Nice to Have / Post-Launch

- [ ] **Push Notifications (FCM/APNs)** — Firebase Admin SDK, Expo permissions. Not testable on iOS simulator / Android without Play Services. Deferred post-launch.
- [ ] **Admin Panel web** — Bonus resolution UI, sync control, tournament management. Not needed for MVP (scripts + Smart Cron cover it for <1000 users).
- [ ] **Podium design polish** — Visual refinement of top-3 podium component
- [ ] **Prediction streaks / achievements** — Gamification layer
- [ ] **Group activity feed** — Timeline of events per group
- [ ] **User profile photo upload** — Avatar from camera/gallery

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| iOS vs Android style inconsistency on home screen "Ver proximos partidos" button | Low | Button renders small/left-aligned on iOS, full-width on Android. Fix when polishing UI components. |
| `app.controller.spec.ts` has stale `getHello` test | Low | Boilerplate NestJS test, unrelated to app functionality. |
| Apple Sign In not testable | Medium | Requires Apple Developer Program ($99/year). Google OAuth verified and working. |
| iOS "Mis Grupos" section in tournament detail | Low | Navigation from standalone tournament detail to group detail may have edge cases on iOS. Deferred. |
| Navigation cross-tab state | Low | Deep-linking across tabs (e.g., tournament → group) may not preserve back stack in all scenarios. Deferred. |
| Match filtering gaps — invisible matches | Medium | SCHEDULED+locked, POSTPONED, and CANCELLED matches are invisible (not in any tab). LIVE matches correctly show in Pronósticos, NOT Resultados. See truth table below. Not blocking for MVP but needs fix before World Cup. |

### Match Filtering Truth Table (GroupTournamentScreen)

Discovered 2026-04-07. The client-side filtering in `[slug].tsx` has gaps where certain match states are invisible to the user.

| Match Status | `isMatchLocked()` | Pronósticos tab | Resultados tab | Visible? |
|---|---|---|---|---|
| SCHEDULED | `false` (>5min to kickoff) | ✅ Predictable section | ❌ | ✅ |
| SCHEDULED | `true` (≤5min to kickoff) | ❌ Excluded by `!isMatchLocked(m)` | ❌ Not FINISHED | ❌ **INVISIBLE** |
| LIVE | `true` (always) | ✅ "En vivo" section | ❌ | ✅ |
| FINISHED | `true` (always) | ❌ | ✅ | ✅ |
| POSTPONED | `true` (always) | ❌ Not SCHEDULED | ❌ Not FINISHED | ❌ **INVISIBLE** |
| CANCELLED | `true` (always) | ❌ Not SCHEDULED | ❌ Not FINISHED | ❌ **INVISIBLE** |

**Key findings:**
1. **LIVE matches show in Pronósticos, NOT Resultados** — `getLiveMatches()` feeds into `pronosticosSections`. Resultados only shows `FINISHED`.
2. **SCHEDULED+locked gap** — A match within 5 minutes of kickoff but not yet LIVE disappears from both tabs. Small window (≤5 min) but real.
3. **POSTPONED/CANCELLED are invisible** — No tab handles these statuses. During the World Cup, postponed matches would vanish entirely.

**Recommended fix (future):**
- Add SCHEDULED+locked matches to Pronósticos as a "Próximos a empezar" section (locked, non-editable)
- Add POSTPONED matches to Resultados with a "Postergado" badge
- CANCELLED matches to Resultados with a "Cancelado" badge or filtered with explanation

## Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| API-Football squad endpoint returns current roster, not historical | Low | Only affects past tournaments. Current/future tournament imports are accurate. |
| No structured logging (JSON) | Low | Using NestJS built-in Logger. Consider pino for production. |
| No rate limiting on API | Medium | Add before production launch. |
| No health check endpoint | Low | Add `/health` for infrastructure monitoring. |
