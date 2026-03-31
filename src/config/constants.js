// Marka Renkleri — Warm Fiore Tema
export const COLORS = {
  fioreOrange: '#EC671A',
  fioreSiyah: '#2C1E14',
  headerDark: '#261810',
  headerGradient: 'linear-gradient(170deg, #3D2B1F, #261810)',
  fioreBeyaz: '#FFFFFF',
  orangeLight: '#E8993A',
  orangeGlow: 'rgba(236,103,26,0.07)',
  orangeSoft: 'rgba(236,103,26,0.04)',
  cream: '#FFF8F2',
  warmGray: '#F2EAE2',
  gray: '#B8A596',
  grayLight: '#F2EAE2',
  grayDark: '#7A6455',
  green: '#34915A',
  greenBg: 'rgba(52,145,90,0.06)',
  gold: '#C8860A',
  goldBg: 'rgba(200,134,10,0.07)',
  goldDark: '#A06D08',
  goldLight: '#E8C36E',
  blue: '#4B8AD4',
  blueBg: 'rgba(75,138,212,0.06)',
  red: '#D94444',
  purple: '#8B6CC6',
};

// Font aileleri — DM Sans (hem başlık hem gövde)
export const FONTS = {
  heading: "'DM Sans', -apple-system, sans-serif",
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
