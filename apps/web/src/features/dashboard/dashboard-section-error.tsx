/**
 * Indicador inline para cuando una sección puntual falló (DTO con `null`).
 *
 * Equivalente al `SectionError` mobile. NO usa `ErrorState` shared porque
 * ese componente está pensado para errores full-screen con retry button —
 * acá queremos un bloque chico, sin acción, dentro del scroll.
 */
import { cn } from "@/lib/cn";

interface DashboardSectionErrorProps {
  label: string;
  className?: string;
  testId?: string;
}

export function DashboardSectionError({
  label,
  className,
  testId,
}: DashboardSectionErrorProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      className={cn(
        "rounded-2xl border border-border bg-surface px-5 py-4 text-center text-sm font-medium text-text-muted",
        className,
      )}
    >
      No se pudo cargar {label}
    </div>
  );
}
