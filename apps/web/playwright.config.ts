import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Pichichi PWA E2E suite.
 *
 * Notes:
 *  - `testDir` points at `./tests/e2e` where the spec files live.
 *  - `baseURL` defaults to `http://localhost:3000` (Next dev default). Override
 *    via `PLAYWRIGHT_BASE_URL` to run against a deployed environment.
 *  - `webServer` boots `npm run dev` (Next dev). We DO NOT run `next build`
 *    in tests — production build is operated manually (see README).
 *  - Backend is fully mocked via `page.route('**\/api/v1/**', ...)` so the
 *    suite can run in CI without secrets, the real API or a database.
 *  - We register only the `chromium` project for now. WebKit / Firefox can be
 *    added later if a regression appears that is browser-specific.
 *  - Reporters: `list` for terminal feedback + `html` for the post-run report
 *    bundle. `retries` is 0 locally and 2 on CI to absorb the occasional
 *    network blip in shared runners.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // We boot Next dev (NOT next build / next start) — production build
        // and deploys are operated manually per project policy.
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          // Dummy values so `env.googleClientIdOptional()` and
          // `env.apiUrlOptional()` resolve without throwing. Tests intercept
          // every `/api/v1/**` call so the URL never has to be real.
          NEXT_PUBLIC_API_URL: "http://localhost:3000/api/v1",
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: "e2e-dummy-google-client-id.apps.googleusercontent.com",
        },
      },
});
