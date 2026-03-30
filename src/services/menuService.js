import { db } from '../config/firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { MENU_DATA } from '../config/menu-data.js';

/**
 * Menüyü Firestore'dan yükle. Boşsa menu-data.js'den seed et.
 * Returns: [{ id, name, category, categoryIcon, type, price14oz, price16oz, singleSize, isGoat, note, order }]
 */
export async function loadMenu() {
  const snap = await getDocs(collection(db, 'menuItems'));
  if (snap.empty) {
    // İlk yükleme — menu-data.js'den Firestore'a aktar
    await seedMenu();
    const snap2 = await getDocs(collection(db, 'menuItems'));
    return snap2.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * menu-data.js'deki verileri Firestore'a yaz
 */
export async function seedMenu() {
  const batch = writeBatch(db);
  let order = 0;
  for (const cat of MENU_DATA) {
    for (const item of cat.items) {
      const id = `${cat.category}__${item.name}`.replace(/[\/\s#]/g, '_');
      batch.set(doc(db, 'menuItems', id), {
        name: item.name,
        category: cat.category,
        categoryIcon: cat.icon,
        type: cat.type,
        price14oz: item.price14oz || 0,
        price16oz: item.price16oz || 0,
        singleSize: item.singleSize || false,
        isGoat: item.isGoat || false,
        stampEligible: item.stampEligible !== undefined ? item.stampEligible : (cat.stampEligible || false),
        note: item.note || '',
        order: order++,
        active: true,
      });
    }
  }
  await batch.commit();
}

/**
 * Menü verisini kategoriye göre grupla (müşteri menüsü için)
 */
export function groupByCategory(items) {
  const cats = {};
  const sorted = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
  for (const item of sorted) {
    if (!item.active) continue;
    if (!cats[item.category]) {
      cats[item.category] = {
        category: item.category,
        icon: item.categoryIcon || '☕',
        type: item.type || 'hot',
        items: [],
      };
    }
    cats[item.category].items.push(item);
  }
  return Object.values(cats);
}

/**
 * Mevcut kategorileri listele
 */
export function getCategories(items) {
  const cats = new Map();
  for (const item of items) {
    if (!cats.has(item.category)) {
      cats.set(item.category, { name: item.category, icon: item.categoryIcon || '☕', type: item.type || 'hot' });
    }
  }
  return Array.from(cats.values());
}
