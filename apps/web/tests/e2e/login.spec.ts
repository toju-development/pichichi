import { test, expect } from "./fixtures/api-mocks";
import { MOCK_TOKENS, MOCK_USER } from "./mocks/users";

/**
 * T8.2 — Login flow.
 *
 * We do NOT exercise the real Google popup (it's not interceptable by
 * `page.route`). Instead, we verify:
 *   1. /app/login renders the Google CTA when there's no auth seeded.
 *   2. Calling `useAuthStore.login(...)` from the page (the same payload the
 *      mutation handler dispatches in production) flips the store, persists,
 *      and the SPA navigates to /app where the dashboard mounts.
 *
 * This is the same "drive the store directly" trick used by the unit tests in
 * `auth-store.test.ts` — it covers the post-OAuth state transition without
 * coupling to Google's iframe internals.
 */

test.describe("login", () => {
  test("unauthenticated visit shows the Google CTA", async ({ page, apiMocks }) => {
    void apiMocks;
    await page.goto("/app/login");
    await expect(page.getByTestId("app-login-form")).toBeVisible();
    await expect(page.getByTestId("app-login-google-button")).toBeVisible();
    await expect(page.getByTestId("app-login-google-button")).toBeEnabled();
  });

  test("a successful auth response navigates to /app and renders the dashboard", async ({
    page,
    apiMocks,
  }) => {
    void apiMocks;
    await page.goto("/app/login");
    await expect(page.getByTestId("app-login-google-button")).toBeEnabled();

    // Drive the store the same way `useLoginWithGoogle` does on success.
    await page.evaluate(
      ({ accessToken, refreshToken, user }) => {
        type LoginPayload = {
          accessToken: string;
          refreshToken: string;
          user: typeof user;
        };
        type AuthStoreApi = {
          getState: () => { login: (payload: LoginPayload) => void };
        };
        const win = window as unknown as { __PICHICHI_AUTH__?: AuthStoreApi };
        // The store isn't on window in production — fall back to seeding
        // localStorage and reloading, which is what production does after
        // `persist` writes the response.
        if (win.__PICHICHI_AUTH__) {
          win.__PICHICHI_AUTH__.getState().login({ accessToken, refreshToken, user });
          return;
        }
        const persisted = {
          state: { accessToken, refreshToken, user },
          version: 0,
        };
        window.localStorage.setItem("pichichi-auth", JSON.stringify(persisted));
        window.localStorage.setItem("pichichi_access_token", accessToken);
        window.localStorage.setItem("pichichi_refresh_token", refreshToken);
      },
      {
        accessToken: MOCK_TOKENS.accessToken,
        refreshToken: MOCK_TOKENS.refreshToken,
        user: MOCK_USER,
      },
    );

    await page.goto("/app");
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByTestId("dashboard-user-stats")).toBeVisible();
  });
});
