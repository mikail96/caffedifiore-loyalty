importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCTPyKP1k4BoFb8piun55bBDFDaUVnGYWM",
  authDomain: "caffedifiore-loyalty.firebaseapp.com",
  projectId: "caffedifiore-loyalty",
  storageBucket: "caffedifiore-loyalty.firebasestorage.app",
  messagingSenderId: "481376898189",
  appId: "1:481376898189:web:85d725379a4d027c1226c4"
});

const messaging = firebase.messaging();

// Background push handler
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'CaffeDiFiore', {
    body: body || 'Yeni bir bildiriminiz var!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-64.png',
    vibrate: [200, 100, 200],
  });
});
