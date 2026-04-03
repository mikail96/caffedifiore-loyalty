// CaffeDiFiore Kış Menüsü - Ocak 2026 fiyatları
export const MENU_DATA = [
  {
    category: 'Espresso & More',
    icon: '☕',
    type: 'hot',
    stampEligible: true,
    items: [
      { name: 'Espresso', price14oz: 80, singleSize: true },
      { name: 'Americano', price14oz: 140, price16oz: 150 },
      { name: 'Caffe Latte', price14oz: 160, price16oz: 170 },
      { name: 'Cappuccino', price14oz: 160, price16oz: 170 },
      { name: 'Flat White', price14oz: 110, singleSize: true },
      { name: 'Cortado', price14oz: 110, singleSize: true },
    ],
  },
  {
    category: 'Chocolate Coffee',
    icon: '🍫',
    type: 'hot',
    stampEligible: true,
    items: [
      { name: 'White Chocolate Mocha', price14oz: 180, price16oz: 190 },
      { name: 'Caffe Mocha', price14oz: 180, price16oz: 190 },
      { name: 'Chocolate Cookies Latte', price14oz: 185, price16oz: 195 },
    ],
  },
  {
    category: 'Flavored Coffee',
    icon: '🌸',
    type: 'hot',
    stampEligible: true,
    items: [
      { name: 'Caramel Macchiato', price14oz: 180, price16oz: 190 },
      { name: 'Salted Caramel Latte', price14oz: 180, price16oz: 190 },
      { name: 'Pumpkin Spice Latte', price14oz: 180, price16oz: 190 },
      { name: 'Cream Latte', price14oz: 185, price16oz: 195 },
      { name: 'Lotus Latte', price14oz: 185, price16oz: 195 },
      { name: '#GOAT Latte', price14oz: 185, price16oz: 195, isGoat: true },
    ],
  },
  {
    category: 'Sıcak Çikolata',
    icon: '🍫',
    type: 'hot',
    stampEligible: true,
    items: [
      { name: 'Hot Chocolate', price14oz: 150, price16oz: 160 },
      { name: 'Chai Tea Latte', price14oz: 165, price16oz: 175 },
      { name: '#GOAT Tiger Spice', price14oz: 220, price16oz: 240, isGoat: true },
    ],
  },
  {
    category: 'Demleme & Çay',
    icon: '🫗',
    type: 'hot',
    stampEligible: false, // Çay damga kazandırmaz, filtre kahve kazandırır
    items: [
      { name: 'Filtre Kahve', price14oz: 140, price16oz: 150, stampEligible: true },
      { name: 'Türk Kahvesi', price14oz: 100, price16oz: 120, stampEligible: true, sizeLabel14: 'Single', sizeLabel16: 'Double' },
      { name: 'Bitki Çayı', price14oz: 100, singleSize: true, stampEligible: false },
      { name: 'Çay', price14oz: 60, singleSize: true, stampEligible: false },
    ],
  },
  {
    category: 'Soğuk Kahve',
    icon: '🧊',
    type: 'cold',
    stampEligible: true,
    items: [
      { name: 'Ice Americano', price16oz: 170 },
      { name: 'Ice Latte', price16oz: 185 },
      { name: 'Ice Chai Tea Latte', price16oz: 190 },
      { name: 'Ice Caramel Macchiato', price16oz: 195 },
      { name: 'Ice Cream Latte', price16oz: 195 },
      { name: 'Ice Choco Cookies Latte', price16oz: 195 },
      { name: 'Ice White Mocha', price16oz: 195 },
      { name: 'Ice Mocha', price16oz: 195 },
      { name: 'Ice Filtre (Sütlü)', price16oz: 150 },
      { name: 'Cold Brew', price16oz: 200 },
    ],
  },
  {
    category: 'Coffee Blend',
    icon: '🥤',
    type: 'cold',
    stampEligible: true,
    items: [
      { name: '#GOAT Frappe', price16oz: 200, isGoat: true },
      { name: 'Caramel Frappe', price16oz: 200 },
    ],
  },
  {
    category: 'Ice Blend',
    icon: '🍹',
    type: 'cold',
    stampEligible: true,
    items: [
      { name: 'Mango Passion Fruit', price16oz: 190 },
      { name: 'Apple Forest', price16oz: 190 },
    ],
  },
  {
    category: 'Milk Blend',
    icon: '🥛',
    type: 'cold',
    stampEligible: true,
    items: [
      { name: 'Chocolate', price16oz: 185 },
      { name: 'Strawberry Cookies', price16oz: 195 },
    ],
  },
  {
    category: 'Sei Perfetto',
    icon: '✨',
    type: 'cold',
    stampEligible: true,
    items: [
      { name: 'Red Dream', price16oz: 195 },
      { name: '#GOAT Lime', price16oz: 195, isGoat: true },
    ],
  },
  {
    category: 'Soğuk İçecekler',
    icon: '🍋',
    type: 'cold',
    stampEligible: false,
    items: [
      { name: 'Limonata', price14oz: 150, price16oz: 170, note: 'Aromalı' },
      { name: 'Strawberry Passion', price16oz: 190 },
      { name: 'Chai Cola', price16oz: 195 },
    ],
  },
  {
    category: 'Ekstralar',
    icon: '➕',
    type: 'extra',
    stampEligible: false,
    items: [
      { name: 'Extra Shot', price: 40 },
      { name: 'Extra Aroma', price: 40, note: 'Krema, Bal, Bar Sosu, Püre' },
      { name: 'Milk+', price: 40, note: 'Badem, Soya, Yulaf' },
    ],
  },
];

// Toplam ürün sayısı
export const TOTAL_ITEMS = MENU_DATA.reduce((sum, cat) => sum + cat.items.length, 0);
