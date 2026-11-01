import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCTPyKP1k4BoFb8piun55bBDFDaUVnGYWM",
  authDomain: "caffedifiore-loyalty.firebaseapp.com",
  projectId: "caffedifiore-loyalty",
  storageBucket: "caffedifiore-loyalty.firebasestorage.app",
  messagingSenderId: "481376898189",
  appId: "1:481376898189:web:85d725379a4d027c1226c4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Mobil ağlarda (özellikle iOS Safari + hücresel) WebChannel takılmasını önlemek için long polling
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export default app;
