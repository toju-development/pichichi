import { Logo } from "@/components/logo";

const FOOTER_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Términos y Condiciones", href: "/terms" },
  { label: "Política de Privacidad", href: "/privacy-policy" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "Twitter / X",
    href: "https://x.com/pichichi_app",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center sm:items-start">
            <a href="#">
              <Logo size="default" />
            </a>
            <p className="mt-3 text-sm text-text-tertiary">
              Hecho con pasión para el Mundial 2026
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-4 sm:items-end">
            <div className="flex gap-6">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-text-secondary transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
            {/* Social */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-text-tertiary transition-all hover:bg-primary/10 hover:text-primary"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary/10 pt-6 text-center">
          <p className="text-xs text-text-tertiary">
            © {new Date().getFullYear()} Pichichi. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
