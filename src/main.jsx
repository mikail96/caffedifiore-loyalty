import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const style = document.createElement('style');
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  html, body { overscroll-behavior: none; -webkit-user-select: none; user-select: none; touch-action: manipulation; }
  input, textarea { -webkit-user-select: text; user-select: text; }
  body { background: #0A0908; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  input, textarea, select { outline: none; -webkit-tap-highlight-color: transparent; }
  button, a, div { -webkit-tap-highlight-color: transparent; outline: none; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  ::selection { background: rgba(236,103,26,0.2); }
  input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #1E1A17 inset !important;
    -webkit-text-fill-color: #F5F0EB !important;
    caret-color: #F5F0EB;
  }
  input:focus, textarea:focus { outline: none; }
  canvas { color-scheme: light !important; filter: none !important; -webkit-filter: none !important; mix-blend-mode: normal !important; }
  [data-qr] { color-scheme: light !important; forced-color-adjust: none !important; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker — sadece firebase-messaging-sw.js kullan
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Eski sw.js varsa sil
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      if (reg.active?.scriptURL?.includes('sw.js') && !reg.active.scriptURL.includes('firebase-messaging')) {
        await reg.unregister();
        console.log('Old SW unregistered');
      }
    }
    // Sadece Firebase messaging SW
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => {
        console.log('FCM SW registered:', reg.scope);
        // Her 60 saniyede güncelleme kontrolü
        setInterval(() => reg.update(), 60000);
      })
      .catch(err => console.log('FCM SW failed:', err));

    // Yeni SW aktif olunca sayfayı yenile
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        window.location.reload();
      }
    });
  });
}
