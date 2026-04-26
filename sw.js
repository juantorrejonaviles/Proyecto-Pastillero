/**
 * Service Worker — Mi Pastillero PWA
 * Cache-first strategy para funcionamiento offline.
 */

const CACHE_NAME = 'pastillero-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './icon-512.png',
  './manifest.json'
];

// Instalar: Cachear todos los archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando archivos estáticos...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estrategia Network-First para CSS/JS para evitar problemas de caché en desarrollo
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // EXTREMO: Si es localhost, no interceptar nada para evitar problemas con Vite HMR en desarrollo
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Estrategia: Network-First para archivos que cambian a menudo
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First para el resto (iconos, fuentes, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});
