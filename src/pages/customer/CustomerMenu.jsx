import { useState, useEffect } from 'react';
import { db } from '../../config/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { COLORS, FONTS } from '../../config/constants.js';
import { MENU_DATA } from '../../config/menu-data.js';
import { loadMenu, groupByCategory } from '../../services/menuService.js';

const f = FONTS;
const HeartIcon = ({ filled }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? COLORS.red : 'none'} stroke={filled ? COLORS.red : COLORS.grayLight} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;

export default function CustomerMenu() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [menuData, setMenuData] = useState(MENU_DATA);
  const [sizes, setSizes] = useState({ hotSmall: '14oz', hotLarge: '16oz', coldSize: '16oz' });

  useEffect(() => {
    loadMenu().then(items => {
      const grouped = groupByCategory(items);
      if (grouped.length > 0) setMenuData(grouped);
    }).catch(() => {});
    getDoc(doc(db, 'settings', 'sizes')).then(snap => {
      if (snap.exists()) setSizes(snap.data());
    }).catch(() => {});
  }, []);

  const menu = menuData[activeCategory];
  const toggleFav = (name) => { const n = new Set(favorites); if (n.has(name)) n.delete(name); else n.add(name); setFavorites(n); };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #3D2B1F, #2A1810)', padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <img src="/icons/logo-header.png" alt="" style={{ height: 24 }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.fioreBeyaz, fontFamily: f.heading }}>Menü</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontStyle: 'italic', fontFamily: f.heading }}>Sei Perfetto</div>
      </div>

      {/* Kategori */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px', overflowX: 'auto', background: COLORS.fioreBeyaz, borderBottom: `1px solid ${COLORS.grayLight}` }}>
        {menuData.map((cat, i) => (
          <div key={cat.category} onClick={() => setActiveCategory(i)} style={{
            padding: '8px 16px', borderRadius: 24, fontSize: 12, fontWeight: 600,
            whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
            background: activeCategory === i ? COLORS.fioreSiyah : 'transparent',
            color: activeCategory === i ? COLORS.fioreBeyaz : COLORS.grayDark,
          }}>
            {cat.category}
          </div>
        ))}
      </div>

      {/* Ürünler */}
      <div style={{ padding: '14px 20px 90px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.fioreSiyah, fontFamily: f.heading }}>{menu.category}</span>
          {menu.type === 'hot' && <span style={{ fontSize: 11, color: COLORS.gray, fontWeight: 600 }}>{sizes.hotSmall} · {sizes.hotLarge}</span>}
          {menu.type === 'cold' && <span style={{ fontSize: 11, color: COLORS.gray, fontWeight: 600 }}>{sizes.coldSize}</span>}
        </div>

        {menu.items.map(item => {
          const isFav = favorites.has(item.name);
          const hasDualPrice = menu.type === 'hot' && item.price16oz && !item.singleSize;
          return (
            <div key={item.name} style={{
              background: COLORS.fioreBeyaz, borderRadius: 16, padding: '14px 16px',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 1px 8px rgba(42,24,16,0.04)',
              border: item.isGoat ? `1.5px solid ${COLORS.gold}30` : '1px solid transparent',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: item.isGoat ? COLORS.goldBg : menu.type === 'cold' ? 'rgba(59,130,246,0.06)' : COLORS.orangeGlow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.isGoat ? COLORS.gold : menu.type === 'cold' ? COLORS.blue : COLORS.fioreOrange }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.fioreSiyah }}>{item.name}</span>
                  {item.isGoat && <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.gold, background: COLORS.goldBg, padding: '2px 8px', borderRadius: 6 }}>GOAT</span>}
                </div>
                {item.note && <div style={{ fontSize: 11, color: COLORS.gray, marginTop: 3 }}>{item.note}</div>}
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {hasDualPrice ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: COLORS.gray, fontWeight: 600 }}>{sizes.hotSmall}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreSiyah }}>₺{item.price14oz}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: COLORS.gray, fontWeight: 600 }}>{sizes.hotLarge}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreSiyah }}>₺{item.price16oz}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    {item.sizeLabel && <div style={{ fontSize: 9, color: COLORS.gray, fontWeight: 600 }}>{item.sizeLabel}</div>}
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreSiyah }}>₺{item.price14oz || item.price16oz || item.price}</div>
                  </div>
                )}
              </div>

              {menu.type !== 'extra' && (
                <div onClick={() => toggleFav(item.name)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <HeartIcon filled={isFav} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
