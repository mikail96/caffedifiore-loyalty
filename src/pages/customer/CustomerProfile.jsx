import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { COLORS, FONTS } from '../../config/constants.js';
import { maskPhone, calculateLevel } from '../../utils/helpers.js';

const f = FONTS;
const InstaIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;

export default function CustomerProfile() {
  const { userData, user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'stampLogs'), where('customerId', '==', user.uid), orderBy('timestamp', 'desc'), limit(20)))
      .then(snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [user]);

  if (!userData) return null;
  const level = userData.level || calculateLevel(userData.totalStamps || 0);
  const isGoat = level === 'goat';
  const levelLabel = isGoat ? 'Fiore GOAT' : level === 'mudavim' ? 'Fiore Müdavim' : 'Fiore Misafir';
  const lc = isGoat ? COLORS.gold : COLORS.fioreOrange;

  const typeLabels = { stamp: ['Damga', COLORS.fioreOrange], free_redeemed: ['Ücretsiz', COLORS.green], goat_monthly: ['GOAT Aylık', COLORS.gold], admin_add: ['+Damga', COLORS.fioreOrange], admin_remove: ['-Damga', COLORS.red], referral_bonus: ['Referans', COLORS.blue] };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      <div style={{ background: COLORS.headerGradient, padding: '20px 20px 24px', textAlign: 'center', borderBottom: `1px solid ${COLORS.divider}` }}>
        <div style={{ marginBottom: 12 }}><img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 24 }} /></div>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${lc}15`, border: `2px solid ${lc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, fontWeight: 700, color: lc }}>{userData.name?.charAt(0)}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.fioreBeyaz }}>{userData.name}</div>
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: `${lc}10`, padding: '5px 12px', borderRadius: 20, border: `1px solid ${lc}15` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: lc }} />
          <span style={{ fontSize: 10, color: lc, fontWeight: 600 }}>{levelLabel}</span>
        </div>
      </div>
      <div style={{ padding: '14px 16px 80px' }}>
        {/* İstatistikler */}
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            {[[userData.totalStamps||0,'Toplam Damga',COLORS.fioreOrange],[Math.floor((userData.totalStamps||0)/7),'Ücretsiz Kahve',COLORS.green],[userData.referralCount||0,'Davet',COLORS.gold]].map(([v,l,c])=>(
              <div key={l}><div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
        </div>

        {/* Hesap Bilgileri */}
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 14 }}>Hesap Bilgileri</div>
          {[['Telefon', maskPhone(userData.phone||'')],['E-posta', userData.email||'—'],['Doğum Tarihi', userData.birthDate||'—'],['Üyelik', userData.createdAt?new Date(userData.createdAt.seconds*1000).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—']].map(([l,v],i)=>(
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i?`1px solid ${COLORS.divider}`:'none' }}>
              <span style={{ fontSize: 13, color: COLORS.gray }}>{l}</span><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreBeyaz }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Damga Geçmişi */}
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 14 }}>Geçmiş İşlemler</div>
          {history.length === 0 ? (
            <div style={{ fontSize: 13, color: COLORS.gray, textAlign: 'center', padding: '16px 0' }}>Henüz işlem yok</div>
          ) : history.map((h, i) => {
            const [label, color] = typeLabels[h.type] || ['İşlem', COLORS.gray];
            const date = h.timestamp?.toDate?.() || (h.timestamp?.seconds ? new Date(h.timestamp.seconds * 1000) : null);
            return (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i ? `1px solid ${COLORS.divider}` : 'none' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: '3px 10px', borderRadius: 10 }}>{label}</span>
                  {date && <span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8 }}>{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {h.cardAfter !== undefined && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.grayDark }}>{h.cardAfter}/7</span>}
              </div>
            );
          })}
        </div>

        {/* Instagram */}
        <div onClick={() => window.open('https://www.instagram.com/caffedifiore/', '_blank')} style={{ background: COLORS.cardBg, borderRadius: 20, padding: '16px 18px', border: `1px solid ${COLORS.divider}`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #E1306C, #F77737, #FCAF45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><InstaIcon /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>Bizi Takip Edin</div>
            <div style={{ fontSize: 12, color: COLORS.grayDark, marginTop: 2 }}>@caffedifiore</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.gray} strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>

        {/* Kurallar */}
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
