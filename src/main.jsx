import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Global styles
const style = document.createElement('style');
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #030303; -webkit-font-smoothing: antialiased; }
  input { outline: none; }
  ::-webkit-scrollbar { width: 0; height: 0; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker kayıt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Ana service worker (cache + offline)
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));

    // Firebase messaging service worker (push notifications)
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => console.log('FCM SW registered:', reg.scope))
      .catch(err => console.log('FCM SW failed:', err));
  });
}
