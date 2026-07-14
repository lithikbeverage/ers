// sw.js

const CACHE_NAME = 'lithik-beverage-v1';

// List of static assets to cache for offline use
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/config.js',
    '/manifest.json',
    '/images/icon.jpg'
];

// 1. Install Event: Cache the static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Clean up old caches if the version updates
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event: Network-first strategy with cache fallback
// This ensures users always get the latest app version if online, 
// but falls back to the cached version if offline.
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (like Firebase API calls)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If network fetch is successful, update the cache
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // If offline, serve from cache
                return caches.match(event.request);
            })
    );
});
