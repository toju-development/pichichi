import { LoadingScreen } from "@/features/shared/loading-screen";

/**
 * Loading boundary for the entire `/app/*` segment.
 *
 * Server Component by default. Shown by Next.js while a child server segment
 * is suspending (initial render or navigation). Per-feature pages can also
 * provide their own nested `loading.tsx`.
 */
export default function AppLoading() {
  return <LoadingScreen testId="app-loading" label="Cargando…" />;
}
