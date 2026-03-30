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
  const levelColor = isGoat ? COLORS.gold : COLORS.fioreOrange;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #3D2B1F, #2A1810)', padding: '24px 24px 28px', textAlign: 'center' }}>
        <img src="/icons/logo-header.png" alt="" style={{ height: 24, opacity: 0.9 }} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${levelColor}18`, border: `2px solid ${levelColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px auto 10px', fontSize: 24, fontWeight: 700, color: levelColor, fontFamily: f.heading }}>
          {userData.name?.charAt(0)}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.fioreBeyaz, fontFamily: f.heading }}>{userData.name}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${levelColor}12`, padding: '6px 16px', borderRadius: 24, border: `1.5px solid ${levelColor}20` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: levelColor }} />
            <span style={{ fontSize: 12, color: levelColor, fontWeight: 700 }}>{levelLabel}</span>
          </span>
        </div>
      </div>

      <div style={{ padding: '16px 20px 20px' }}>
        {/* İstatistikler */}
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            {[
              [userData.totalStamps || 0, 'Toplam Damga', COLORS.fioreOrange],
              [Math.floor((userData.totalStamps || 0) / 7), 'Ücretsiz Kahve', COLORS.green],
              [userData.referralCount || 0, 'Davet', COLORS.blue],
            ].map(([val, label, color]) => (
              <div key={label}>
                <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: f.heading }}>{val}</div>
                <div style={{ fontSize: 11, color: COLORS.gray, fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hesap Bilgileri */}
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: COLORS.fioreSiyah, fontFamily: f.heading }}>Hesap Bilgileri</div>
          {[
            ['Telefon', maskPhone(userData.phone || '')],
            ['E-posta', userData.email || '—'],
            ['Doğum Tarihi', userData.birthDate || '—'],
            ['Üyelik', userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
          ].map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i ? `1px solid ${COLORS.warmGray}` : 'none' }}>
              <span style={{ fontSize: 13, color: COLORS.gray, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreSiyah }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Kurallar */}
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: COLORS.fioreSiyah, fontFamily: f.heading }}>Program Kuralları</div>
          {[
            'Damgalar arası minimum 15 dakika bekleme süresi vardır.',
            'Kahve, blend, kokteyl ve sıcak çikolata damga kazandırır.',
            'Çay, soğuk içecek, kutulu ürünler ve tatlılar damga kazandırmaz.',
            '7 damga = 1 ücretsiz kahve.',
            'Misafir: 0–15  |  Müdavim: 16–39  |  GOAT: 40+',
            'GOAT: Aylık 1 ücretsiz + %10 indirim.',
            ...(isGoat ? ['Ödeme öncesi GOAT üyeliğinizi kasaya gösteriniz.'] : []),
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${COLORS.warmGray}` : 'none' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS.fioreOrange, marginTop: 7, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: COLORS.grayDark, fontWeight: 500, lineHeight: 1.6 }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
