import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional CTA — usually a `<Link>` or `<button>`. */
  action?: ReactNode;
  testId?: string;
  className?: string;
}

/**
 * Reusable empty-state block for lists/tables that returned zero rows.
 *
 * Used across dashboard, groups and tournaments. Keeps the visual language
 * consistent and exposes a stable selector for E2E.
 */
export function EmptyState({
  title,
  description,
  action,
  testId = "empty-state",
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description ? (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
