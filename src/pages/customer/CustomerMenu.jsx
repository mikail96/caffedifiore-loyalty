import { useState } from 'react';
import { COLORS } from '../../config/constants.js';
import { MENU_DATA } from '../../config/menu-data.js';

export default function CustomerMenu() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const menu = MENU_DATA[activeCategory];

  const toggleFav = (name) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(name)) newFavs.delete(name);
    else newFavs.add(name);
    setFavorites(newFavs);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #1a1510, #0d0b08)', padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/icons/logo-header.png" alt="" style={{ height: 24 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.fioreBeyaz }}>Menü</div>
            <div style={{ fontSize: 12, color: COLORS.fioreOrange, marginTop: 2, fontStyle: 'italic', fontFamily: 'Georgia, serif', letterSpacing: 1 }}>Sei Perfetto</div>
          </div>
        </div>
      </div>

      {/* Kategori seçici */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', background: COLORS.fioreBeyaz, borderBottom: `1.5px solid ${COLORS.grayLight}` }}>
        {MENU_DATA.map((cat, i) => (
          <div
            key={cat.category}
            onClick={() => setActiveCategory(i)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', cursor: 'pointer',
              background: activeCategory === i ? COLORS.fioreOrange : COLORS.warmGray,
              color: activeCategory === i ? COLORS.fioreBeyaz : COLORS.fioreSiyah,
              border: activeCategory === i ? `2px solid ${COLORS.fioreOrange}` : '2px solid transparent',
            }}
          >
            {cat.icon} {cat.category}
          </div>
        ))}
      </div>

      {/* Ürün listesi */}
      <div style={{ padding: '10px 16px 90px' }}>
        {/* Kategori başlığı + boyut bilgisi */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.fioreSiyah }}>{menu.icon} {menu.category}</div>
          {menu.type === 'hot' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ fontSize: 10, color: COLORS.fioreOrange, fontWeight: 700, background: COLORS.orangeGlow, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.fioreOrange}30` }}>14oz</span>
              <span style={{ fontSize: 10, color: COLORS.fioreOrange, fontWeight: 700, background: COLORS.orangeGlow, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.fioreOrange}30` }}>16oz</span>
            </div>
          )}
          {menu.type === 'cold' && (
            <span style={{ fontSize: 10, color: COLORS.blue, fontWeight: 700, background: COLORS.blueBg, padding: '3px 8px', borderRadius: 6, border: `1px solid ${COLORS.blue}30` }}>16oz</span>
          )}
        </div>

        {menu.items.map(item => {
          const isFav = favorites.has(item.name);
          const hasDualPrice = menu.type === 'hot' && item.price16oz && !item.singleSize;

          return (
            <div key={item.name} style={{
              background: COLORS.fioreBeyaz, borderRadius: 14, padding: '12px 14px',
              marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 1px 6px rgba(3,3,3,0.05)',
              border: item.isGoat ? `2px solid ${COLORS.gold}` : '1px solid transparent',
            }}>
              {/* İkon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: item.isGoat ? COLORS.goldBg : menu.type === 'hot' ? COLORS.orangeGlow : menu.type === 'cold' ? COLORS.blueBg : COLORS.warmGray,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                border: item.isGoat ? `1.5px solid ${COLORS.gold}` : 'none',
              }}>
                {item.isGoat ? '🐐' : menu.icon}
              </div>

              {/* İsim */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreSiyah }}>{item.name}</span>
                  {item.isGoat && <span style={{ fontSize: 9, fontWeight: 800, color: COLORS.fioreBeyaz, background: COLORS.gold, padding: '2px 6px', borderRadius: 8 }}>#GOAT</span>}
                </div>
                {item.note && <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 2, fontWeight: 500 }}>{item.note}</div>}
              </div>

              {/* Fiyat */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {hasDualPrice ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: COLORS.gray, fontWeight: 600 }}>14oz</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange }}>₺{item.price14oz}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: COLORS.gray, fontWeight: 600 }}>16oz</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange }}>₺{item.price16oz}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.fioreOrange }}>
                    ₺{item.price14oz || item.price16oz || item.price}
                  </div>
                )}
              </div>

              {/* Favori */}
              {menu.type !== 'extra' && (
                <div onClick={() => toggleFav(item.name)} style={{ fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>
                  {isFav ? '❤️' : '🤍'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
