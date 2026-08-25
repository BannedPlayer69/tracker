// Service worker minimo: mette in cache i tre file dell'app e risponde
// prima dalla cache, aggiornandola in background quando c'è rete.
// Dopo un deploy con modifiche, incrementare il numero di versione qui sotto
// per forzare il ricaricamento immediato di tutti i file.
const CACHE = 'tt-cache-v3';
const FILE = ['./', './index.html', './manifest.json', './sw.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((inCache) => {
      const daRete = fetch(e.request)
        .then((risposta) => {
          if (risposta && risposta.ok) {
            const copia = risposta.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return risposta;
        })
        .catch(() => inCache || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return inCache || daRete;
    })
  );
});
