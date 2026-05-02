# Pichichi Web (PWA)

Next.js 16 + React 19 + Tailwind v4. Hosts the landing pages (root) and the installable PWA shell under `/app/*`.

## Getting Started

```bash
npm run dev      # dev server on http://localhost:3000
npm run lint     # 0 errors, 0 warnings expected
npm run test     # vitest watch
npm run test -- --run  # vitest single pass (CI style)
npx tsc --noEmit # type check
```

> ⚠️ **NEVER run `npm run build`** in agent automation. Builds are performed by the deploy pipeline only.

## PWA verification

The PWA layer lives under `apps/web/src/app/manifest.ts` (manifest), `apps/web/public/sw.js` (service worker) and `apps/web/src/features/pwa/` (registration + install banner).

### Verify the manifest

1. `npm run dev`
2. Open Chrome → DevTools → **Application** → **Manifest**.
3. Confirm:
   - `name` = "Pichichi", `short_name` = "Pichichi"
   - `start_url` = `/app`, `scope` = `/app`
   - `display` = `standalone`, `orientation` = `portrait`
   - Icons 192/512 load without 404.
4. Alternatively: `curl -s http://localhost:3000/manifest.webmanifest | jq`.

### Verify the install prompt

The custom banner is mounted in `apps/web/src/app/app/(authed)/layout.tsx` so it only appears for authenticated users.

1. Open the PWA at `/app` in Chrome (Android or desktop).
2. DevTools → **Application** → **Manifest** → click **"Add to home screen"** to manually trigger `beforeinstallprompt`.
3. The custom banner ("Instalá Pichichi") should appear with **Instalar** + **Ahora no**.
4. **Instalar** → invokes the native prompt and hides.
5. **Ahora no** → writes `pichichi-install-dismissed=1` to `localStorage` and hides for the rest of this profile (clear it from DevTools → Application → Local Storage to re-test).
6. If the app is already installed (display-mode `standalone` or iOS `navigator.standalone`), the banner is suppressed.

### Verify the offline shell

1. Visit `/app` in Chrome with DevTools open.
2. **Application** → **Service Workers** → confirm `/sw.js` is `activated and is running`, scope = `/app/`.
3. **Network** → check **Offline**.
4. Reload `/app` → the cached shell renders (network-first with cache fallback).
5. **Authenticated API requests are NOT cached** — `/api/*` paths and any request with an `Authorization` header bypass the SW entirely. Cross-origin requests also pass through.

### Bumping the SW version

When the cached shell needs to invalidate (e.g. layout changes that affect `/app`):

1. Edit `apps/web/public/sw.js`.
2. Bump the constant `CACHE_VERSION` (e.g. `"v1"` → `"v2"`).
3. On the next page load, the new SW installs, the `activate` event prunes any cache whose name starts with `pichichi-shell-` and does NOT match the new version, and `clients.claim()` switches active tabs over.

There is no automatic versioning. Bumping is manual and intentional.

## Local OAuth Setup

The web app uses Google Sign-In via `@react-oauth/google` (`<GoogleLogin />`), which runs in **ID-token mode** (FedCM/popup). This flow returns a credential to the browser and posts it to `POST /auth/google` — there is **no server-side redirect URI**.

To configure locally:

1. Go to **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs** and pick (or create) a Web client.
2. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (web dev server)
   - `http://localhost:3001` (used by some scripts/tests)
   - The production web origin (e.g. `https://pichichi.app`)
3. **Authorized redirect URIs**: leave empty for the FedCM/popup ID-token flow used by `<GoogleLogin />`. Only required if you switch to the auth-code flow.
4. Copy the Web client ID into `apps/web/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`. See `apps/web/.env.local.example` for the full env contract.
5. Restart `npm run dev` so Next picks up the new env.

## Deployment guardrails

> **Vercel and Railway are operated manually. NO push automático. NO deploy automático.**

Agents and CI MUST NOT run:

- `git commit`, `git push`, `git add`
- `npm run build`, `next build`
- `vercel deploy`, `railway up`, or any deploy CLI

The deploy is a manual human action against the production project. If you need a preview, ask the human operator.

## Project layout

- `src/app/` — App Router. Landing at `/`, PWA shell at `/app/*`.
- `src/app/app/(authed)/` — auth-gated routes (dashboard, groups, tournaments, predictions, leaderboard, notifications, profile).
- `src/features/` — feature modules (predictions, groups, leaderboard, notifications, profile, app-shell, pwa, auth, dashboard, tournaments, matches, shared).
- `src/hooks/` — TanStack Query hooks + small reusable hooks (`use-dialog-a11y`, `use-confirm-dialog`).
- `src/stores/` — Zustand stores (auth-store with `persist` + hydration).
- `src/lib/` — routes, storage keys, axios client.
- `src/test/` — Vitest setup.
- `public/` — static assets including `sw.js` and PWA icons (`icon-192.png`, `icon-512.png`).
