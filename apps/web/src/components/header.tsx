"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Características", href: "/#caracteristicas" },
  { label: "Partidos", href: "/#partidos" },
  { label: "FAQ", href: "/faq" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-surface/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center">
          <Logo size="default" />
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#descargar"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-light px-6 py-2.5 text-sm font-semibold text-text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
          >
            Descargar App
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-primary-surface md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-primary/10 bg-surface/95 backdrop-blur-xl px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-surface hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#descargar"
              className="mt-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-6 py-3 text-center text-sm font-semibold text-text-on-primary shadow-lg shadow-primary/20"
              onClick={() => setMenuOpen(false)}
            >
              Descargar App
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
