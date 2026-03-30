importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// === CACHE (offline destek) ===
const CACHE_NAME = 'cdf-loyalty-v1';
const STATIC_ASSETS = ['/', '/icons/logo-header.png', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebase')) return;
  event.respondWith(
    fetch(event.request).then((r) => { if (r.ok) { caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone())); } return r; })
    .catch(() => caches.match(event.request).then((c) => c || caches.match('/')))
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
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'CaffeDiFiore', {
    body: body || 'Yeni bir bildiriminiz var!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-64.png',
    vibrate: [200, 100, 200],
  });
});

// Bildirime tıklayınca uygulamayı aç
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => list.length > 0 ? list[0].focus() : clients.openWindow('/'))
  );
});
