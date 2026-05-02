"use client";

import { cn } from "@/lib/cn";

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  testId?: string;
  className?: string;
}

/**
 * Reusable async-error block.
 *
 * Used by `app/error.tsx` and any feature-level error fallback. Client
 * Component because the optional retry button needs an `onClick` handler.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Reintentar",
  testId = "error-state",
  className,
}: ErrorStateProps) {
  return (
    <div
      data-testid={testId}
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-danger">{title}</h2>
      {description ? (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          data-testid={`${testId}-retry`}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary transition hover:bg-primary-dark"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
