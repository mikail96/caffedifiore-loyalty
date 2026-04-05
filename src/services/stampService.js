import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase.js';

const functions = getFunctions(app, 'europe-west1');

// Cloud Function çağrıları
const addStampFn = httpsCallable(functions, 'addStamp');
const redeemFreeFn = httpsCallable(functions, 'redeemFree');
const redeemGoatMonthlyFn = httpsCallable(functions, 'redeemGoatMonthly');
const adminAdjustStampFn = httpsCallable(functions, 'adminAdjustStamp');

/**
 * Damga ekle (Personel veya Admin QR)
 */
export async function addStamp({ customerId, staffId, branchId, productCategory, isAdmin }) {
  const result = await addStampFn({ customerId, staffId, branchId, productCategory, isAdmin });
  return result.data;
}

/**
 * Sadakat ücretsiz kullan
 */
export async function redeemFree({ customerId, staffId, branchId, isAdmin }) {
  const result = await redeemFreeFn({ customerId, staffId, branchId, isAdmin });
  return result.data;
}

/**
 * GOAT aylık ücretsiz kullan
 */
export async function redeemGoatMonthly({ customerId, staffId, branchId, isAdmin }) {
  const result = await redeemGoatMonthlyFn({ customerId, staffId, branchId, isAdmin });
  return result.data;
}

/**
 * Admin damga düzenleme (+/-)
 */
export async function adminAdjustStamp({ customerId, action }) {
  const result = await adminAdjustStampFn({ customerId, action });
  return result.data;
}
