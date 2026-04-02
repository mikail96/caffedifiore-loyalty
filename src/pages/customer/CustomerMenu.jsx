import { useState, useEffect } from 'react';
import { db } from '../../config/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { COLORS, FONTS } from '../../config/constants.js';
import { MENU_DATA } from '../../config/menu-data.js';
import { loadMenu, groupByCategory } from '../../services/menuService.js';

const f = FONTS;

export default function CustomerMenu() {
  const [activeCategory, setActiveCategory] = useState(0);
  
  const [menuData, setMenuData] = useState(MENU_DATA);
  const [sizes, setSizes] = useState({ hotSmall: '14oz', hotLarge: '16oz', coldSize: '16oz' });

  useEffect(() => {
    loadMenu().then(items => { const g = groupByCategory(items); if (g.length > 0) setMenuData(g); }).catch(() => {});
    getDoc(doc(db, 'settings', 'sizes')).then(s => { if (s.exists()) setSizes(s.data()); }).catch(() => {});
  }, []);

  const menu = menuData[activeCategory];
  

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      <div style={{ background: COLORS.headerGradient, padding: '20px 20px 16px', borderBottom: `1px solid ${COLORS.divider}` }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}><img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 24 }} /></div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.fioreBeyaz }}>Menü</div>
        <div style={{ fontFamily: f.script, fontSize: 16, color: COLORS.fioreOrange, marginTop: 2 }}>Sei Perfetto</div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: COLORS.cardBg, borderBottom: `1px solid ${COLORS.divider}`, overflowX: 'auto' }}>
        {menuData.map((cat, i) => (
          <div key={cat.category} onClick={() => setActiveCategory(i)} style={{ padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', background: activeCategory === i ? COLORS.fioreOrange : 'transparent', color: activeCategory === i ? '#fff' : COLORS.gray, border: activeCategory === i ? 'none' : `1px solid ${COLORS.divider}` }}>{cat.category}</div>
        ))}
      </div>
      <div style={{ padding: '14px 16px 90px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz }}>{menu.category}</span>
          {menu.type === 'hot' && <span style={{ fontSize: 10, color: COLORS.gray }}>{sizes.hotSmall} · {sizes.hotLarge}</span>}
          {menu.type === 'cold' && <span style={{ fontSize: 10, color: COLORS.gray }}>{sizes.coldSize}</span>}
        </div>
        {menu.items.map(item => {
          
          const dual = menu.type === 'hot' && item.price16oz && !item.singleSize;
          return (
            <div key={item.name} style={{ background: COLORS.cardBg, borderRadius: 16, padding: '13px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${COLORS.divider}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: item.isGoat ? COLORS.goldBg : COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.isGoat ? COLORS.gold : COLORS.fioreOrange, opacity: 0.6 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.fioreBeyaz }}>{item.name}</span>
                  {item.isGoat && <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.gold, background: COLORS.goldBg, padding: '2px 8px', borderRadius: 6 }}>GOAT</span>}
                </div>
                {item.note && <div style={{ fontSize: 11, color: COLORS.gray, marginTop: 3 }}>{item.note}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {dual ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: COLORS.gray }}>{sizes.hotSmall}</div><div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>₺{item.price14oz}</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: COLORS.gray }}>{sizes.hotLarge}</div><div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>₺{item.price16oz}</div></div>
                  </div>
                ) : (
                  <div>{item.sizeLabel && <div style={{ fontSize: 9, color: COLORS.gray }}>{item.sizeLabel}</div>}<div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz }}>₺{item.price14oz || item.price16oz || item.price}</div></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
