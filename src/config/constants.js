// Marka Renkleri
export const COLORS = {
  fioreOrange: '#EC671A',
  fioreSiyah: '#030303',
  headerDark: '#1a1510',
  headerGradient: 'linear-gradient(180deg, #1a1510, #0d0b08)',
  fioreBeyaz: '#FFFFFF',
  orangeLight: '#F4943E',
  orangeGlow: 'rgba(236,103,26,0.12)',
  orangeSoft: 'rgba(236,103,26,0.05)',
  cream: '#FFF9F3',
  warmGray: '#F5F0EB',
  gray: '#6B7280',
  grayLight: '#E8E2DC',
  grayDark: '#374151',
  green: '#22C55E',
  greenBg: 'rgba(34,197,94,0.08)',
  gold: '#D4940A',
  goldBg: 'rgba(212,148,10,0.1)',
  goldDark: '#A67508',
  goldLight: '#F5CE6E',
  blue: '#3B82F6',
  blueBg: 'rgba(59,130,246,0.08)',
  red: '#EF4444',
  purple: '#8B5CF6',
};

// Font aileleri
export const FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
};

// Seviye Eşikleri
export const LEVELS = {
  misafir: { min: 0, max: 15, label: 'Fiore Misafir', icon: '☕', color: COLORS.gray },
  mudavim: { min: 16, max: 39, label: 'Fiore Müdavim', icon: '⭐', color: COLORS.fioreOrange },
  goat: { min: 40, max: Infinity, label: 'Fiore GOAT', icon: '🐐', color: COLORS.gold },
};

// Damga Sistemi
export const STAMP_CONFIG = {
  stampsForFree: 7,
  goatThreshold: 40,
  mudavimThreshold: 16,
  minStampIntervalMinutes: 15,
  qrRefreshSeconds: 60,
  gpsRadiusMeters: 100,
};

// Damga Kazandıran / Kazandırmayan Kategoriler
export const STAMP_CATEGORIES = [
  { id: 'hot_coffee', name: 'Sıcak Kahve', icon: '☕', eligible: true, desc: 'Espresso, Latte, Cappuccino, Mocha vb.' },
  { id: 'cold_coffee', name: 'Soğuk Kahve', icon: '🧊', eligible: true, desc: 'Ice Latte, Cold Brew, Ice Mocha vb.' },
  { id: 'blend', name: 'Blend / Frappe', icon: '🥤', eligible: true, desc: 'GOAT Frappe, Caramel Frappe vb.' },
  { id: 'cocktail', name: 'Soğuk Kokteyl', icon: '🍹', eligible: true, desc: 'Mango Passion, Apple Forest vb.' },
  { id: 'sei_perfetto', name: 'Sei Perfetto', icon: '✨', eligible: true, desc: 'Red Dream, GOAT Lime' },
  { id: 'hot_chocolate', name: 'Sıcak Çikolata', icon: '🍫', eligible: true, desc: 'Hot Chocolate, Chai Tea Latte' },
  { id: 'milk_blend', name: 'Milk Blend', icon: '🥛', eligible: true, desc: 'Chocolate, Strawberry Cookies' },
  { id: 'tea', name: 'Çay / Bitki Çayı', icon: '🫖', eligible: false, desc: 'Damga kazandırmaz' },
  { id: 'cold_drink', name: 'Soğuk İçecek', icon: '🍋', eligible: false, desc: 'Limonata, Soda, Su' },
  { id: 'packaged', name: 'Kutulu Ürün', icon: '🥫', eligible: false, desc: 'Redbull, Fusetea, Su' },
  { id: 'dessert', name: 'Tatlı / Atıştırmalık', icon: '🍰', eligible: false, desc: 'Cookie, Kek, Sandviç' },
  { id: 'extra', name: 'Ekstra', icon: '➕', eligible: false, desc: 'Shot, Aroma, Milk+' },
];

// Şubeler
export const BRANCHES = {
  gokkusagi: {
    id: 'gokkusagi',
    name: 'CaffeDiFiore Gökkuşağı AVM',
    shortName: 'Gökkuşağı AVM',
    lat: null, // Admin panelden haritadan seçilecek
    lng: null,
  },
  forum: {
    id: 'forum',
    name: 'CaffeDiFiore Forum Kampüs AVM',
    shortName: 'Forum Kampüs AVM',
    lat: null,
    lng: null,
  },
};

// Admin bilgileri
export const ADMIN_PHONE = '+905358841480';
