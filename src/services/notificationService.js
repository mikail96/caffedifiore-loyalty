import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import app from '../config/firebase.js';

let messaging = null;

try {
  messaging = getMessaging(app);
} catch (e) {
  console.log('FCM not supported in this browser');
}

/**
 * Bildirim izni iste ve FCM token al
 * @param {string} customerId - Müşteri Firestore ID
 * @returns {string|null} FCM token
 */
export async function requestNotificationPermission(customerId) {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Bildirim izni reddedildi');
      return null;
    }

    // FCM token al
    const token = await getToken(messaging, {
      vapidKey: '' // Blaze'e geçince Firebase Console'dan VAPID key alınacak
    }).catch(() => null);

    if (token && customerId) {
      // Token'ı müşteri dokümanına kaydet
      await updateDoc(doc(db, 'customers', customerId), {
        fcmTokens: arrayUnion(token),
      }).catch(() => {});
    }

    return token;
  } catch (err) {
    console.log('Bildirim hatası:', err);
    return null;
  }
}

/**
 * Uygulama açıkken gelen bildirimleri dinle
 * @param {function} callback - Bildirim geldiğinde çağrılacak fonksiyon
 */
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    callback({ title, body });
  });
}

/**
 * Bildirim desteği var mı kontrol et
 */
export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && messaging !== null;
}

/**
 * Mevcut bildirim izin durumu
 */
export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}
