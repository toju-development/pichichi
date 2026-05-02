/**
 * Pichichi PWA Service Worker — vanilla, sin libs externas (no next-pwa, no workbox).
 *
 * Estrategia (Spec web-pwa, Design §9 y §15):
 *   - App shell autenticado cacheado bajo nombre versionado manualmente.
 *   - install: precachea el shell mínimo (`/app` + manifest).
 *   - activate: limpia versiones viejas del cache de Pichichi y toma control.
 *   - fetch:
 *       - Solo intercepta GET. Resto pasa directo a la red.
 *       - NUNCA cachea requests con header `Authorization`.
 *       - NUNCA cachea paths `/api/*`.
 *       - NUNCA cachea cross-origin (deja pasar a la red sin tocar cache).
 *       - Navegaciones HTML dentro del scope `/app/*`: network-first con
 *         fallback a cache (shell offline).
 *       - Static assets (mismo origen, dentro del scope): cache-first.
 *
 * Versionado: bumpear `CACHE_VERSION` manualmente al cambiar el shell.
 * Al activar la nueva versión, los caches con prefijo `pichichi-shell-` que NO
 * coincidan con el nuevo nombre se eliminan.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `pichichi-shell-${CACHE_VERSION}`;

// Shell mínimo. Mantener corto a propósito: el resto se cachea on-demand.
const SHELL_ASSETS = ["/app", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // No queremos romper la instalación si un asset falla — log y seguimos.
        console.warn("[sw] precache failed:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("pichichi-shell-") && key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Decide si una request es elegible para cachear.
 * Reglas duras: misma origin, GET, sin Authorization, fuera de /api/*.
 */
function isCacheable(request) {
  if (request.method !== "GET") return false;
  if (request.headers.has("Authorization")) return false;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }

  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;

  return true;
}

/**
 * ¿Es una navegación HTML dentro del scope `/app/*`?
 * Lo usamos para decidir network-first con fallback a cache.
 */
function isAppNavigate(request) {
  if (request.mode !== "navigate") return false;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }
  return url.pathname === "/app" || url.pathname.startsWith("/app/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isCacheable(request)) {
    // Pasa directo a la red. No interceptamos.
    return;
  }

  if (isAppNavigate(request)) {
    // Network-first: intentamos red, si falla servimos shell cacheado.
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Refrescamos cache con la última copia del shell (solo si OK).
          if (response && response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {
                /* swallow */
              });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Último fallback: la home del shell.
            return caches.match("/app");
          })
        )
    );
    return;
  }

  // Static assets / otros GET cacheables: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {
                /* swallow */
              });
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
