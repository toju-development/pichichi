# Pichichi - Roadmap

> This document is auto-maintained. Updated as features are implemented.
>
> Last updated: 2026-04-03

## V1 - World Cup 2026

### Completado

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
- [x] **match-data-sync** — Smart Cron + API-Football for automatic live result updates (`0f4ce7a` + `69cedca`, 2026-04-03)
  - Smart Cron polling: hourly heartbeat + 5-min dynamic intervals when matches are live
  - API-Football integration: batch fixture fetching, rate-limit tracking
  - Match change detection and auto-score updates via `MatchesService.updateScore()`
  - Tournament auto-finish: when all matches complete, tournament status → FINISHED
  - Champion bonus auto-resolve on tournament final
  - `BonusPredictionsService.resolveByKey()` for manual resolution (TOP_SCORER, MVP, REVELATION)
  - Admin API: `POST /match-sync/trigger`, `POST /match-sync/toggle`, `POST /bonus-predictions/resolve`
  - Debug logging + immediate syncTick on enable for faster feedback
  - Tested live with Liga Argentina match (Talleres 0-1 Boca)

### Fase 1 — Funcionalidades Faltantes

Features needed to complete the MVP functionality.

#### Home Screen con datos reales
- La pantalla de Inicio muestra datos hardcodeados/placeholder
- Necesita: stats reales del usuario (predicciones, puntos, posición), próximos partidos across groups, accesos rápidos

#### Socket.IO client en mobile
- El backend YA emite eventos (match:score_update, match:status_update, leaderboard:update, prediction:points_calculated)
- El mobile NO tiene socket.io-client — todo es poll-based con TanStack Query
- Crítico para la experiencia en vivo del Mundial

#### Notification triggers
- El backend de notificaciones existe (CRUD, mark read, unread count, FCM token registration)
- PERO `sendPush()` es un stub y NINGÚN servicio dispara notificaciones
- Necesita triggers: partido por empezar (1h antes), resultado disponible, cambio en leaderboard, invitación a grupo

#### Push Notifications (FCM)
- Firebase Admin SDK no configurado
- Expo notification permissions no implementados
- Depende de Notification triggers

#### Ranking tab global
- La tab "Ranking" existe en el tab bar pero es placeholder estático
- El leaderboard por grupo dentro del torneo SÍ funciona
- Necesita decisión UX: ¿ranking por grupo? ¿agregado? ¿por torneo?

#### Admin Panel Web
- Interfaz web para administración
- Resolver bonus predictions manualmente (TOP_SCORER, MVP, REVELATION)
- Control de sync (trigger, toggle, status)
- Gestión de torneos
- Probablemente Next.js (ya existe en el monorepo)

### Fase 2 — Mejoras UI y Navegación

Polish and UX improvements.

#### Profile screen funcional
- Actualmente solo muestra nombre + logout
- Settings rows ("Mi cuenta", "Notificaciones", "Acerca de") son no-ops
- Necesita: editar display name, configuración real

#### Navigation fixes
- Cross-tab state pollution (bug recurrente)
- Dual-stack mirror pattern implementado pero hay edge cases

#### Onboarding flow
- Usuarios nuevos llegan a home screen vacía sin grupos
- Necesita flujo guiado: crear/unirse a primer grupo → elegir torneo → empezar a predecir

#### Match detail screen
- No existe pantalla dedicada al detalle de un partido
- Podría mostrar: predicciones de todos los miembros del grupo, comparación head-to-head, stats del partido
- Driver de engagement social

#### Error handling / offline
- No hay error boundary global
- No hay manejo de offline (predicciones se pierden sin conexión)
- No hay retry queue

#### Deep linking
- Compartir invitación de grupo por link (WhatsApp, etc.)
- Actualmente solo se comparte código manual
- Clave para viralidad durante el Mundial

### Fase 3 — Monetización

#### Modelo de negocio
- Definir estrategia de monetización (freemium, premium features, etc.)
- El sistema de planes FREE/PREMIUM ya existe con enforcement en backend
- Necesita definición clara de qué features son premium

#### Stripe integration
- Cero código de Stripe actualmente
- Modelo de Plan ya existe en DB (FREE/PREMIUM con límites)
- Implementar checkout, webhooks, subscription management

### Fase 4 — Deploy y Distribución

#### EAS development build
- Necesario para testear OAuth real en dispositivos físicos
- Actualmente se usa Expo Go con dev-login bypass

#### Apple Developer Program + Apple Sign In
- $99/año enrollment
- Apple REQUIERE Apple Sign In si ofrecés third-party auth (Google)
- Backend verification code ya existe

#### Deploy backend
- API corriendo en localhost:3000
- Necesita hosting (Railway, Fly.io, AWS, etc.)
- Base de datos PostgreSQL en la nube
- Redis (opcional pero recomendado para leaderboard cache)

#### Deploy landing web
- Landing Next.js "Selva Mundialista" existe
- Necesita deploy (Vercel probable)
- Dominio propio

#### Rate limiting API
- Sin protección actualmente
- Necesita rate limiting básico antes de ir a producción

#### App Store + Play Store submission
- Builds de producción
- Store listings, screenshots, descriptions
- Review process

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
