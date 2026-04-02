import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS, FONTS } from '../../config/constants.js';
import { maskPhone, calculateLevel } from '../../utils/helpers.js';

const f = FONTS;
export default function CustomerProfile() {
  const { userData } = useAuth();
  if (!userData) return null;
  const level = userData.level || calculateLevel(userData.totalStamps || 0);
  const isGoat = level === 'goat';
  const levelLabel = isGoat ? 'Fiore GOAT' : level === 'mudavim' ? 'Fiore Müdavim' : 'Fiore Misafir';
  const lc = isGoat ? COLORS.gold : COLORS.fioreOrange;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      <div style={{ background: COLORS.headerGradient, padding: '20px 20px 24px', textAlign: 'center', borderBottom: `1px solid ${COLORS.divider}` }}>
        <div style={{ marginBottom: 12 }}><img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 20, opacity: 0.85 }} /></div>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${lc}15`, border: `2px solid ${lc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, fontWeight: 700, color: lc }}>{userData.name?.charAt(0)}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.fioreBeyaz }}>{userData.name}</div>
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: `${lc}10`, padding: '5px 12px', borderRadius: 20, border: `1px solid ${lc}15` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: lc }} />
          <span style={{ fontSize: 10, color: lc, fontWeight: 600 }}>{levelLabel}</span>
        </div>
      </div>
      <div style={{ padding: '14px 16px 80px' }}>
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            {[[userData.totalStamps||0,'Toplam Damga',COLORS.fioreOrange],[Math.floor((userData.totalStamps||0)/7),'Ücretsiz Kahve',COLORS.green],[userData.referralCount||0,'Davet',COLORS.gold]].map(([v,l,c])=>(
              <div key={l}><div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 14 }}>Hesap Bilgileri</div>
          {[['Telefon', maskPhone(userData.phone||'')],['E-posta', userData.email||'—'],['Doğum Tarihi', userData.birthDate||'—'],['Üyelik', userData.createdAt?new Date(userData.createdAt.seconds*1000).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—']].map(([l,v],i)=>(
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i?`1px solid ${COLORS.divider}`:'none' }}>
              <span style={{ fontSize: 13, color: COLORS.gray }}>{l}</span><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreBeyaz }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 14 }}>Loyalty Kuralları</div>
          {['Damgalar arası minimum 15 dakika bekleme süresi vardır.','Kahve, blend, kokteyl ve sıcak çikolata damga kazandırır.','Çay, soğuk içecek, kutulu ürünler ve tatlılar damga kazandırmaz.','Her alışveriş tek damga hakkı verir. Aynı anda birden fazla kahve alınsa dahi tek damga eklenir.','Her müşteri damga almak için kendi hesabından QR kodunu okutmalıdır.','7 damga tamamlandığında 1 ücretsiz kahve hakkı kazanılır.','Misafir: 0–15 | Müdavim: 16–39 | GOAT: 40+','GOAT üyelere her ay dilediği bir kahve ücretsiz verilir.','GOAT üyeler tüm alışverişlerinde %10 indirim hakkına sahiptir.',...(isGoat?['Ödeme öncesi GOAT üyeliğinizi kasaya gösteriniz.']:[])].map((r,i)=>(
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i?`1px solid ${COLORS.divider}`:'none' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS.fioreOrange, marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: COLORS.grayDark, fontWeight: 500, lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
