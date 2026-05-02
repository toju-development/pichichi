"use client";

import { useEffect, useState } from "react";

/**
 * Banner descartable de instalación PWA.
 *
 * Captura el evento `beforeinstallprompt` (Chromium / Edge / Android Chrome),
 * lo difiere y expone un CTA propio "Instalá Pichichi" + descartable.
 *
 * Reglas (Spec web-pwa, Design §9, paridad mobile = app instalable):
 *   - NO renderizamos si ya está instalada (display-mode standalone o iOS
 *     `navigator.standalone`).
 *   - NO renderizamos si el user descartó (`localStorage.pichichi-install-dismissed`).
 *   - NO renderizamos si el browser nunca disparó `beforeinstallprompt`
 *     (Safari/Firefox no lo soportan — paridad nula es válida).
 *   - "Instalar" → invoca `deferredPrompt.prompt()` + espera `userChoice`.
 *   - "Ahora no" → marca dismissed en localStorage y oculta.
 *
 * Storage: localStorage (no sessionStorage) — el dismiss persiste entre
 * sesiones. Si el user limpia storage o desinstala la PWA y vuelve a entrar,
 * el banner reaparecerá si el browser dispara el evento de nuevo.
 *
 * Tipos: el evento `beforeinstallprompt` no está en lib.dom estándar; lo
 * tipamos localmente como interface mínima del subset que usamos.
 */

const DISMISS_KEY = "pichichi-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari expone `navigator.standalone` (no estándar, fuera de lib.dom).
  const navWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  if (navWithStandalone.standalone === true) return true;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* swallow — storage no disponible (private mode), no es crítico */
  }
}

export function InstallPrompt(): React.ReactElement | null {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());
  const [installed, setInstalled] = useState<boolean>(() =>
    isStandaloneDisplay()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstall as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (installed) return null;
  if (dismissed) return null;
  if (!deferred) return null;

  const handleInstall = async () => {
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch (err) {
      console.warn("[pwa] install prompt failed:", err);
    } finally {
      // El evento es de un solo uso — limpiamos sí o sí.
      setDeferred(null);
    }
  };

  const handleDismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  return (
    <div
      data-testid="install-prompt"
      className="fixed inset-x-4 bottom-20 z-50 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
      role="dialog"
      aria-labelledby="install-prompt-title"
    >
      <div className="flex-1">
        <p
          id="install-prompt-title"
          className="text-sm font-semibold text-text-primary"
        >
          Instalá Pichichi
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Tené la app en tu pantalla de inicio y entrá en un toque.
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          data-testid="install-prompt-install"
          onClick={handleInstall}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-text-on-primary hover:bg-primary-dark"
        >
          Instalar
        </button>
        <button
          type="button"
          data-testid="install-prompt-dismiss"
          onClick={handleDismiss}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
