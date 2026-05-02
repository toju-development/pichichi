"use client";

// Error boundaries must be Client Components in Next.js App Router.
// Next 16 replaces the old `reset` prop with `unstable_retry`.

import { useEffect } from "react";
import { ErrorState } from "@/features/shared/error-state";

interface AppErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function AppError({ error, unstable_retry }: AppErrorProps) {
  useEffect(() => {
    // TODO: pipe into Sentry / structured logger in a later phase.
    console.error("[/app] segment error:", error);
  }, [error]);

  return (
    <ErrorState
      testId="app-error"
      title="Algo salió mal"
      description="No pudimos cargar esta sección. Probá de nuevo o volvé al inicio."
      retryLabel="Reintentar"
      onRetry={() => unstable_retry()}
    />
  );
}
