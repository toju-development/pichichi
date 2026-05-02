import { test as base, type Page } from "@playwright/test";

import { MOCK_TOKENS, MOCK_USER } from "../mocks/users";
import type { UserDto } from "@pichichi/shared";

/**
 * Auth fixture — seeds localStorage so the AuthProvider rehydrates as
 * `isAuthenticated=true` BEFORE any route loads.
 *
 * Why `addInitScript` (and not `localStorage.setItem` post-navigation):
 *  - The Next 16 `(authed)` layout reads `useAuthStore.isAuthenticated` on
 *    mount; if storage isn't seeded before the first script runs, the user
 *    gets bounced to `/app/login` and the test races itself.
 *  - `addInitScript` runs in every new document, before any page script —
 *    that's the only reliable hook in Playwright for pre-hydration state.
 *
 * Why we seed THREE keys:
 *  - `pichichi-auth` — Zustand `persist` middleware shape
 *    `{ state: {...}, version: 0 }` (key from `STORAGE_KEY_AUTH`).
 *  - `pichichi_access_token` / `pichichi_refresh_token` — raw helpers in
 *    `apps/web/src/lib/storage.ts` consumed by `api/client.ts` for the
 *    Authorization header. Mobile parity.
 *
 * Note re: `useGoogleLogin` popup — we deliberately do NOT exercise the real
 * Google flow in E2E. Popups can't be intercepted by `page.route`, so the
 * login spec drives the store directly via `page.evaluate` instead.
 */

export interface AuthSeed {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

export const DEFAULT_AUTH_SEED: AuthSeed = {
  user: MOCK_USER,
  accessToken: MOCK_TOKENS.accessToken,
  refreshToken: MOCK_TOKENS.refreshToken,
};

export async function seedAuth(page: Page, seed: AuthSeed = DEFAULT_AUTH_SEED): Promise<void> {
  const persistedShape = {
    state: {
      accessToken: seed.accessToken,
      refreshToken: seed.refreshToken,
      user: seed.user,
    },
    version: 0,
  };

  await page.addInitScript(
    ({ persistKey, persisted, accessKey, refreshKey, accessToken, refreshToken }) => {
      try {
        window.localStorage.setItem(persistKey, JSON.stringify(persisted));
        window.localStorage.setItem(accessKey, accessToken);
        window.localStorage.setItem(refreshKey, refreshToken);
      } catch {
        // Test runner — ignore quota / private mode errors silently.
      }
    },
    {
      persistKey: "pichichi-auth",
      persisted: persistedShape,
      accessKey: "pichichi_access_token",
      refreshKey: "pichichi_refresh_token",
      accessToken: seed.accessToken,
      refreshToken: seed.refreshToken,
    },
  );
}

interface AuthFixtures {
  /** Page with auth localStorage pre-seeded (default user + tokens). */
  authedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await seedAuth(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
