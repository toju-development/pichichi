import { cn } from "@/lib/cn";

interface LoadingScreenProps {
  /** Optional copy shown below the spinner. */
  label?: string;
  /** Stable selector for E2E. Defaults to `loading-screen`. */
  testId?: string;
  /** Extra classes appended to the container. */
  className?: string;
}

/**
 * Generic full-segment loading state.
 *
 * Used by `app/loading.tsx` and any feature that wants the same look while
 * data is in flight. Pure CSS spinner — no animation library required.
 */
export function LoadingScreen({
  label = "Cargando…",
  testId = "loading-screen",
  className,
}: LoadingScreenProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 text-text-secondary",
        className,
      )}
    >
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary-surface border-t-primary"
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
