# Remove Tournament from Group — Design Spec

> Date: 2026-03-30

## Overview

Allow group admins to remove a tournament from their group. Includes a pre-check endpoint to show confirmation dialogs with prediction counts before executing the removal.

## Rules

- **Who**: Only group admin
- **Blocked**: Tournament status `IN_PROGRESS`, `FINISHED`, or `CANCELLED` → removal not allowed
- **Allowed**: Tournament status `DRAFT` or `UPCOMING`
  - If predictions exist → confirmation warning with count
  - If no predictions → simple confirmation

## Backend

### Endpoint 1: Check Remove (pre-flight)

```
GET /groups/:id/tournaments/:tournamentId/check-remove
Auth: JWT (admin only via requireAdmin)
```

**Response 200:**
```json
{
  "canRemove": true,
  "predictionsCount": 12,
  "reason": null
}
```

**Response 200 (blocked):**
```json
{
  "canRemove": false,
  "predictionsCount": 0,
  "reason": "TOURNAMENT_IN_PROGRESS"
}
```

**Logic:**
1. `requireAdmin(groupId, userId)`
2. Find GroupTournament (404 if not found)
3. Get tournament status
4. If status IN_PROGRESS / FINISHED / CANCELLED → return `{ canRemove: false, reason }`
5. Count predictions: `prediction.count({ where: { groupId, match: { tournamentId } } })`
6. Return `{ canRemove: true, predictionsCount }`

### Endpoint 2: Delete

```
DELETE /groups/:id/tournaments/:tournamentId
Auth: JWT (admin only via requireAdmin)
```

**Response 200:**
```json
{
  "action": "removed",
  "predictionsDeleted": 12
}
```

**Error responses:**
- 403: Not admin / tournament status blocked
- 404: GroupTournament not found

**Logic:**
1. `requireAdmin(groupId, userId)`
2. Find GroupTournament with tournament include (404 if not found)
3. Check tournament status → ForbiddenException if IN_PROGRESS/FINISHED/CANCELLED
4. Transaction:
   a. Delete predictions: `prediction.deleteMany({ where: { groupId, match: { tournamentId } } })`
   b. Delete bonus predictions: `bonusPrediction.deleteMany({ where: { groupId, tournamentId } })`
   c. Delete GroupTournament record
5. Return `{ action: 'removed', predictionsDeleted }`

### Files to modify (backend):
- `apps/api/src/modules/groups/groups.service.ts` — add `checkRemoveTournament()` and `removeTournament()` methods
- `apps/api/src/modules/groups/groups.controller.ts` — add GET check-remove and DELETE endpoints
- `apps/api/src/modules/groups/dto/` — add response DTOs if needed

## Mobile

### API Client
- `apps/mobile/src/api/groups.ts` — add `checkRemoveTournament(groupId, tournamentId)` and `removeTournament(groupId, tournamentId)`

### Hook
- `apps/mobile/src/hooks/use-groups.ts` — add `useRemoveTournament()` mutation with cache invalidation on `queryKeys.groups.tournaments(groupId)`

### UI Changes
- `apps/mobile/app/(tabs)/groups/[id].tsx` — Tournament cards for admin:
  - Show remove icon (trash/X) on each tournament card
  - Only visible when user is admin AND tournament status is DRAFT or UPCOMING
  - Hidden for IN_PROGRESS/FINISHED/CANCELLED tournaments
  - On tap:
    1. Call `checkRemoveTournament`
    2. If `canRemove: false` → Alert informativo with reason
    3. If `canRemove: true && predictionsCount > 0` → Alert.alert("Eliminar torneo", "Se borrarán {count} predicciones. ¿Estás seguro?", [Cancel, Confirm])
    4. If `canRemove: true && predictionsCount === 0` → Alert.alert("Eliminar torneo", "¿Eliminar {name} del grupo?", [Cancel, Confirm])
    5. On confirm → call `removeTournament` mutation
    6. On success → invalidate queries, show brief feedback

## Data Flow

```
Admin taps remove icon
    │
    ▼
GET /groups/:id/tournaments/:tid/check-remove
    │
    ├── canRemove: false → Alert("No se puede eliminar: torneo en curso")
    │
    └── canRemove: true
         │
         ├── predictionsCount > 0 → Alert("Se borrarán X predicciones. ¿Eliminar?")
         │                              │
         │                              └── Confirm → DELETE /groups/:id/tournaments/:tid
         │
         └── predictionsCount === 0 → Alert("¿Eliminar torneo del grupo?")
                                         │
                                         └── Confirm → DELETE /groups/:id/tournaments/:tid
```

## Data Behavior

- **On removal**: ALL predictions and bonus predictions for the group+tournament combination are hard-deleted in a single transaction. This is irreversible.
- **Re-add after removal**: If the same tournament is added back to the group later, it starts completely fresh — no historical predictions are recovered. Users make new predictions from scratch.
- **Why this is safe**: Removal is only allowed for `DRAFT`/`UPCOMING` tournaments (before they start), so no real points or leaderboard data is ever lost. Once a tournament is `IN_PROGRESS` or `FINISHED`, removal is blocked entirely.

## Not in Scope

- Removing tournaments from the system (tournament CRUD is seed/automation only)
- Undo/restore after removal
- Non-admin tournament management
