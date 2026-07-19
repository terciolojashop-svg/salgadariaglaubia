// Simple Service Worker for Salgadaria Glaubia PWA Installability
const CACHE_NAME = 'glaubia-cache-v1';

self.addEventListener('install', (event) => {
  // Force active immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Respond with network first, then cache if offline
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
