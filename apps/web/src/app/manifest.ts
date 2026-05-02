import type { MetadataRoute } from "next";

/**
 * Web App Manifest del PWA Pichichi.
 *
 * Next 16: archivo `app/manifest.ts` con default export que retorna
 * `MetadataRoute.Manifest`. Servido en `/manifest.webmanifest`.
 *
 * Decisiones (Spec web-pwa, Design §0/§9, paridad mobile):
 *   - `start_url` y `scope` en `/app` para que el shell instalado abra en el
 *     PWA autenticado, NO en la landing.
 *   - `display: "standalone"` — sin chrome del browser, paridad app nativa.
 *   - `orientation: "portrait"` — paridad mobile.
 *   - Colores extraídos de los CSS tokens (`apps/web/src/app/globals.css`):
 *       background_color = --color-bg          → #F0FAF4
 *       theme_color      = --color-primary     → #0B6E4F
 *   - Iconos 192/512 ya presentes en `apps/web/public/`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pichichi",
    short_name: "Pichichi",
    description:
      "Armá tu prode, predecí los scores y ganale a tus amigos. El prode de fútbol más completo.",
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F0FAF4",
    theme_color: "#0B6E4F",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
