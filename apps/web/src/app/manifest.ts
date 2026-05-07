import type { MetadataRoute } from "next";

/**
 * Web App Manifest de la landing pública de Pichichi.
 *
 * Next 16: archivo `app/manifest.ts` con default export que retorna
 * `MetadataRoute.Manifest`. Servido en `/manifest.webmanifest`.
 *
 * Notas:
 *   - `start_url` y `scope` apuntan a la home (`/`). La app interactiva vive en
 *     mobile (Android primero); el sitio web es solo landing/marketing.
 *   - `display: "browser"` — esto es un sitio, no un PWA instalable.
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
    start_url: "/",
    scope: "/",
    display: "browser",
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
