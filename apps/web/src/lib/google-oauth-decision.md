# `@react-oauth/google` vs Google Identity Services — Phase 0 decision

**Decision (Phase 0)**: Use `@react-oauth/google` (`^0.12.2`) as the primary OAuth provider for `apps/web`.

**Why**:
- The mobile app uses `@react-native-google-signin/google-signin`; the web equivalent that mirrors the same DX (provider + hook) is `@react-oauth/google`.
- Phase 0 smoke test (`src/__tests__/google-oauth.smoke.test.tsx`) imports `GoogleOAuthProvider` and renders it under React 19 (jsdom). If this test passes in CI, the package is compatible end-to-end for our use case (provider mount). It does NOT exercise the live Google iframe — that runs only in browser at runtime and is validated in Phase 3 manually + Phase 8 E2E with mocks.
- React 19 peerDeps warnings from npm are noise for this package today; install completed without `--legacy-peer-deps`.

**Fallback (NOT implemented in Phase 0 — only document)**:
- If `@react-oauth/google` blows up in production (live iframe, FedCM, etc.), drop the package and switch to the official Google Identity Services script:
  1. Inject `<Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />` from the `(authed)` segment layout.
  2. Call `google.accounts.id.initialize({ client_id, callback })` inside a Client Component on mount.
  3. Render the button via `google.accounts.id.renderButton(ref.current, { ... })` or use the One Tap flow.
  4. Send the resulting credential to `POST /auth/google` exactly as today.
- Per design §14 + §15 we DO NOT keep both implementations alive at the same time. The decision lives here and changes via a follow-up `sdd` proposal if needed.

**How to validate at runtime (Phase 3 manual smoke)**:
- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`.
- Visit `/app/login`, click the Google button, complete the sign-in.
- If the button never renders or the popup is blocked silently, switch to GIS as documented above.
