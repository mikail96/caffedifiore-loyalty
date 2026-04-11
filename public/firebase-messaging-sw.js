importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// === CACHE (offline destek) ===
const CACHE_NAME = 'cdf-loyalty-__BUILD_VERSION__';
const STATIC_ASSETS = ['/icons/logo-header.png', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebase')) return;

  const url = new URL(event.request.url);

  // HTML ve JS → her zaman network first, cache sadece offline için
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request).then((r) => {
        if (r.ok) { caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone())); }
        return r;
      }).catch(() => caches.match(event.request).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Diğer kaynaklar (resim, font) → cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((r) => {
        if (r.ok) { caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone())); }
        return r;
      });
    }).catch(() => caches.match('/'))
  );
});

// === FIREBASE PUSH ===
firebase.initializeApp({
  apiKey: "AIzaSyCTPyKP1k4BoFb8piun55bBDFDaUVnGYWM",
  authDomain: "caffedifiore-loyalty.firebaseapp.com",
  projectId: "caffedifiore-loyalty",
  storageBucket: "caffedifiore-loyalty.firebasestorage.app",
  messagingSenderId: "481376898189",
  appId: "1:481376898189:web:85d725379a4d027c1226c4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Firebase notification payload'ı otomatik gösterir
  // Sadece data-only mesajlar için burada işlem yapılır
  console.log('Background message:', payload);
});

// Bildirime tıklayınca uygulamayı aç
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => list.length > 0 ? list[0].focus() : clients.openWindow('/'))
  );
});
