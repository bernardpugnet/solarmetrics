const CACHE_VERSION = 'solardataatlas-v2026-03f';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const OFFLINE_PAGE = '/offline.html';

// Core app shell URLs to cache on install
const SHELL_URLS = [
  '/',
  '/fr/',
  '/fr/economie.html',
  '/fr/technologies.html',
  '/fr/outils-autoconsommation.html',
  '/fr/comparateur.html',
  '/manifest.json',
  '/offline.html'
];

// Static assets (fonts, Tailwind, etc.)
const ASSET_PATTERNS = [
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.css$/,
  /\.js$/,
  /cdn\.tailwindcss\.com/,
  /images/,
  /icons/
];

// Install event - cache the app shell
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(SHELL_URLS)
          .catch(err => {
            console.warn('[SW] Some app shell URLs failed to cache:', err);
            // Continue even if some URLs fail
          });
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old versions of our caches
          if (cacheName.startsWith('solardataatlas-') && cacheName !== SHELL_CACHE && cacheName !== ASSETS_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external origins
  if (url.origin !== self.location.origin) {
    return;
  }

  // Determine caching strategy
  if (isStaticAsset(url)) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirst(request));
  } else if (isHTMLPage(url)) {
    // Stale-while-revalidate for HTML pages
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: network-first
    event.respondWith(networkFirst(request));
  }
});

/**
 * Cache-first strategy: return from cache, fallback to network
 */
function cacheFirst(request) {
  return caches.match(request)
    .then(response => {
      if (response) {
        return response;
      }
      return fetch(request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(ASSETS_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        });
    })
    .catch(() => {
      // Return offline page as fallback
      return caches.match(OFFLINE_PAGE)
        .catch(() => new Response('Vous êtes hors ligne', { status: 503 }));
    });
}

/**
 * Stale-while-revalidate strategy: return from cache while fetching updates
 */
function staleWhileRevalidate(request) {
  return caches.match(request)
    .then(response => {
      // Always fetch in background for updates
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            // Update the cache
            const responseToCache = networkResponse.clone();
            caches.open(SHELL_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return cached or offline page
          return response || caches.match(OFFLINE_PAGE);
        });

      // Return cached response immediately if available, otherwise wait for network
      return response || fetchPromise;
    })
    .catch(() => {
      return caches.match(OFFLINE_PAGE)
        .catch(() => new Response('Vous êtes hors ligne', { status: 503 }));
    });
}

/**
 * Network-first strategy: try network first, fallback to cache
 */
function networkFirst(request) {
  return fetch(request)
    .then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }
      // Clone and cache successful responses
      const responseToCache = response.clone();
      caches.open(ASSETS_CACHE).then(cache => {
        cache.put(request, responseToCache);
      });
      return response;
    })
    .catch(() => {
      // Network failed, try cache
      return caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          // Return offline page
          return caches.match(OFFLINE_PAGE)
            .catch(() => new Response('Vous êtes hors ligne', { status: 503 }));
        });
    });
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  return ASSET_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Check if URL is an HTML page
 */
function isHTMLPage(url) {
  return url.pathname === '/' ||
         url.pathname === '/fr/' ||
         url.pathname.endsWith('.html') ||
         (!url.pathname.includes('.') && url.pathname !== '/');
}
