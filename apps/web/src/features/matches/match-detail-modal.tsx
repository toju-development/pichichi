"use client";

/**
 * MatchDetailModal — port de
 * `apps/mobile/src/components/matches/match-detail-modal.tsx`.
 *
 * Renderiza el widget API-Football de un fixture en un modal. Mobile usa
 * `<Modal>` + `<WebView>`; en web usamos `<dialog>` nativo + `<iframe srcDoc>`
 * apuntando al proxy `/widgets/football/` del backend (mismo backend que
 * mobile usa via `EXPO_PUBLIC_API_URL`).
 *
 * URL del proxy: `${env.apiUrl()}/widgets/football/`. En web NO necesitamos
 * el truco de hostUri de Expo — `NEXT_PUBLIC_API_URL` ya apunta al backend
 * correcto en dev/prod.
 *
 * El iframe es sandboxed con `allow-scripts allow-same-origin` para que el
 * `widgets.api-sports.io` script pueda cargar.
 *
 * `externalId === null` → modal cerrado.
 */

import { useEffect, useRef } from "react";

import { env } from "@/lib/env";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface MatchDetailModalProps {
  externalId: number | null;
  onClose: () => void;
}

// ─── Widget HTML ────────────────────────────────────────────────────────────

function buildWidgetHtml(externalId: number, widgetProxyUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
  <style>
    api-sports-widget[data-theme="pichichi"] {
      --primary-color: #0B6E4F;
      --success-color: #10B981;
      --warning-color: #F59E0B;
      --danger-color: #E63946;
      --light-color: #6B7280;

      --home-color: #0B6E4F;
      --away-color: #FFD166;

      --text-color: #1A1A2E;
      --text-color-info: #6B7280;

      --background-color: #F0FAF4;

      --primary-font-size: 0.72rem;
      --secondary-font-size: 0.75rem;
      --button-font-size: 0.8rem;
      --title-font-size: 0.9rem;

      --border: 1px solid #E5E7EB;
      --game-height: 2.3rem;
      --league-height: 2.35rem;

      --score-size: 2.25rem;
      --flag-size: 22px;
      --teams-logo-size: 18px;
      --teams-logo-size-xl: 5rem;
      --hover: rgba(11, 110, 79, 0.08);
    }
  </style>
</head>
<body style="margin:0;padding:12px;background:#F0FAF4;">
  <api-sports-widget
    data-type="game"
    data-game-id="${externalId}"
    data-theme="pichichi"
  ></api-sports-widget>

  <api-sports-widget
    data-type="config"
    data-key="835764c09b77b127b7fe28572d755683"
    data-sport="football"
    data-lang="es"
    data-theme="pichichi"
    data-url-football="${widgetProxyUrl}"
  ></api-sports-widget>
</body>
</html>`;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MatchDetailModal({
  externalId,
  onClose,
}: MatchDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Sync open state with imperative `<dialog>` API.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    if (externalId !== null && !node.open) {
      node.showModal();
    } else if (externalId === null && node.open) {
      node.close();
    }
  }, [externalId]);

  // Native `<dialog>` cancel event (ESC) → close.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    function handleCancel(e: Event) {
      e.preventDefault();
      onClose();
    }

    node.addEventListener("cancel", handleCancel);
    return () => node.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  if (externalId === null) {
    return (
      <dialog
        ref={dialogRef}
        data-testid="match-detail-modal"
        className="hidden"
      />
    );
  }

  // Resolve widget proxy URL — env.apiUrl() throws if NEXT_PUBLIC_API_URL is
  // missing, but at this point the user already navigated past auth, so the
  // app has booted with env present.
  const widgetProxyUrl = `${env.apiUrl()}/widgets/football/`;
  const html = buildWidgetHtml(externalId, widgetProxyUrl);

  return (
    <dialog
      ref={dialogRef}
      data-testid="match-detail-modal"
      onClick={(e) => {
        // Click on backdrop → close (the dialog element itself is the
        // backdrop area; the inner panel stops propagation).
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-0 h-screen max-h-screen w-screen max-w-screen-md border-none bg-transparent p-0 backdrop:bg-black/40 sm:m-auto sm:h-[90vh] sm:rounded-2xl"
    >
      <div
        className="flex h-full w-full flex-col bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex flex-row items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <h2 className="text-xl font-bold text-text-primary">
            Detalle del Partido
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-testid="match-detail-modal-close"
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-secondary transition hover:bg-border"
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        {/* Iframe with API-Football widget */}
        <iframe
          title="API-Football widget"
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin"
          className="h-full w-full flex-1 border-0 bg-transparent"
        />
      </div>
    </dialog>
  );
}
