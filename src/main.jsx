import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const style = document.createElement('style');
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { background: #0A0908; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  input, textarea, select { outline: none; -webkit-tap-highlight-color: transparent; }
  button, a, div { -webkit-tap-highlight-color: transparent; outline: none; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  ::selection { background: rgba(236,103,26,0.2); }
  input:focus, textarea:focus { outline: none; }
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
      .then(reg => console.log('FCM SW registered:', reg.scope))
      .catch(err => console.log('FCM SW failed:', err));
  });
}
