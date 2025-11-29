const CACHE_NAME = 'translator-cache-v1';

// File types to cache
const CACHEABLE_EXTENSIONS = ['.html', '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

// Check if a request should be cached based on its URL
function shouldCache(url) {
  const urlObj = new URL(url);
  
  // Cache same-origin requests only
  if (urlObj.origin !== self.location.origin) {
    return false;
  }
  
  // Cache root path
  if (urlObj.pathname === '/' || urlObj.pathname === '/index.html') {
    return true;
  }
  
  // Check file extension
  return CACHEABLE_EXTENSIONS.some(ext => urlObj.pathname.endsWith(ext));
}

// Install event - activate immediately, no pre-caching needed
// All resources are cached at runtime as they're fetched
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-cacheable requests
  if (!shouldCache(request.url)) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          
          // Optionally update cache in background (stale-while-revalidate for freshness)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {
            // Network failed, but we have cache - that's fine
          });
          
          return cachedResponse;
        }
        
        // Not in cache - fetch from network
        console.log('[Service Worker] Fetching from network:', request.url);
        return fetch(request).then((networkResponse) => {
          // Cache the response for future use
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          
          // Return a fallback for HTML requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return cache.match('/index.html');
          }
          
          throw error;
        });
      });
    })
  );
});
