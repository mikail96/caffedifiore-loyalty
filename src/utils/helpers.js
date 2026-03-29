import { STAMP_CONFIG } from '../config/constants.js';

/**
 * Toplam damga sayısından seviye hesapla
 */
export function calculateLevel(totalStamps) {
  if (totalStamps >= STAMP_CONFIG.goatThreshold) return 'goat';
  if (totalStamps >= STAMP_CONFIG.mudavimThreshold) return 'mudavim';
  return 'misafir';
}

/**
 * Bir sonraki seviyeye kalan damga sayısı
 */
export function stampsToNextLevel(totalStamps) {
  const level = calculateLevel(totalStamps);
  if (level === 'goat') return { next: null, remaining: 0 };
  if (level === 'mudavim') return { next: 'goat', remaining: STAMP_CONFIG.goatThreshold - totalStamps };
  return { next: 'mudavim', remaining: STAMP_CONFIG.mudavimThreshold - totalStamps };
}

/**
 * İlerleme yüzdesi (0-100)
 */
export function levelProgress(totalStamps) {
  const level = calculateLevel(totalStamps);
  if (level === 'goat') return 100;
  if (level === 'mudavim') {
    return Math.min(((totalStamps - STAMP_CONFIG.mudavimThreshold) / (STAMP_CONFIG.goatThreshold - STAMP_CONFIG.mudavimThreshold)) * 100, 100);
  }
  return Math.min((totalStamps / STAMP_CONFIG.mudavimThreshold) * 100, 100);
}

/**
 * İki GPS koordinat arası mesafe hesapla (metre)
 * Haversine formülü
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Dünya yarıçapı metre
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * GPS radius kontrolü
 */
export function isWithinBranchRadius(staffLat, staffLng, branchLat, branchLng) {
  if (!branchLat || !branchLng || !staffLat || !staffLng) return false;
  const distance = calculateDistance(staffLat, staffLng, branchLat, branchLng);
  return distance <= STAMP_CONFIG.gpsRadiusMeters;
}

/**
 * Telefon numarası formatla
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  }
  return phone;
}

/**
 * Telefon numarası maskele
 */
export function maskPhone(phone) {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 4)} *** ** ${clean.slice(9)}`;
  }
  return phone;
}

/**
 * Tarih formatla
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Saat formatla
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * HMAC-based QR token üretimi (basitleştirilmiş)
 * Gerçek uygulamada crypto-js veya Web Crypto API kullanılacak
 */
export function generateQRToken(userId, secret) {
  const timestamp = Math.floor(Date.now() / (STAMP_CONFIG.qrRefreshSeconds * 1000));
  const data = `${userId}:${timestamp}:${secret}`;
  // Basit hash - production'da HMAC-SHA256 kullanılacak
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `CDF:${userId}:${timestamp}:${Math.abs(hash).toString(36)}`;
}

/**
 * Müşteri sıralama (GOAT > Müdavim > Misafir, sonra damga sayısına göre)
 */
export function sortCustomers(customers) {
  const levelOrder = { goat: 0, mudavim: 1, misafir: 2 };
  return [...customers].sort((a, b) => {
    const levelDiff = (levelOrder[a.level] || 2) - (levelOrder[b.level] || 2);
    if (levelDiff !== 0) return levelDiff;
    return (b.totalStamps || 0) - (a.totalStamps || 0);
  });
}
