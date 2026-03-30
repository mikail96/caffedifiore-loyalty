const CACHE_NAME = 'cdf-loyalty-v1';
const STATIC_ASSETS = [
  '/',
  '/icons/logo-header.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET and Firebase/API requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore.googleapis.com')) return;
  if (event.request.url.includes('identitytoolkit.googleapis.com')) return;
  if (event.request.url.includes('firebase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — try cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  let data = { title: 'CaffeDiFiore', body: 'Yeni bir bildiriminiz var!' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data?.text() || data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'CaffeDiFiore', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-64.png',
      tag: data.tag || 'cdf-notification',
      data: data.url || '/',
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click — open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data || '/');
    })
  );
});
