import Link from "next/link";
import { ROUTES } from "@/lib/routes";

/**
 * 404 boundary for the `/app/*` segment.
 *
 * Server Component. Triggered when a page calls `notFound()` or when a route
 * doesn't match any file in the segment.
 */
export default function AppNotFound() {
  return (
    <main
      data-testid="app-not-found"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p className="text-sm font-medium uppercase tracking-wider text-primary">
        404
      </p>
      <h1 className="text-2xl font-semibold text-text-primary">
        No encontramos esta página
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        La ruta que buscás no existe o se movió. Volvé al inicio para seguir
        navegando.
      </p>
      <Link
        href={ROUTES.app.dashboard}
        data-testid="app-not-found-home-link"
        className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary transition hover:bg-primary-dark"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
