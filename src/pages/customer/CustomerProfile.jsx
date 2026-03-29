import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS } from '../../config/constants.js';
import { maskPhone, calculateLevel } from '../../utils/helpers.js';

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', ...style }}>
    {children}
  </div>
);

export default function CustomerProfile() {
  const { userData } = useAuth();
  if (!userData) return null;

  const level = userData.level || calculateLevel(userData.totalStamps || 0);
  const isGoat = level === 'goat';

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: isGoat ? 'linear-gradient(135deg, #1a0f00, #0d0b08)' : 'linear-gradient(180deg, #1a1510, #0d0b08)', padding: '16px 20px 20px', textAlign: 'center' }}>
        <img src="/icons/logo-header.png" alt="" style={{ height: 24 }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.fioreBeyaz, marginTop: 10 }}>{userData.name}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: isGoat ? COLORS.goldBg : COLORS.orangeGlow,
            padding: '6px 14px', borderRadius: 20, fontSize: 13,
            color: isGoat ? COLORS.gold : COLORS.fioreOrange,
            fontWeight: 800, border: `1.5px solid ${isGoat ? COLORS.gold : COLORS.fioreOrange}30`,
          }}>
            {isGoat ? '🐐 Fiore GOAT' : level === 'mudavim' ? '⭐ Fiore Müdavim' : '☕ Fiore Misafir'}
          </span>
        </div>
      </div>

      {/* Hesap Bilgileri */}
      <div style={{ padding: '14px 16px' }}>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Hesap Bilgileri</div>
          {[
            ['Telefon', maskPhone(userData.phone || '')],
            ['Doğum Tarihi', userData.birthDate || '—'],
            ['Üyelik Tarihi', userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.grayLight}` }}>
              <span style={{ fontSize: 13, color: COLORS.gray, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreSiyah }}>{value}</span>
            </div>
          ))}
        </Card>

        {/* İstatistikler */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>İstatistiklerim</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            {[
              [userData.totalStamps || 0, 'Toplam Damga', COLORS.fioreOrange],
              [Math.floor((userData.totalStamps || 0) / 7), 'Ücretsiz Kahve', COLORS.green],
              [userData.referralCount || 0, 'Referans', COLORS.blue],
            ].map(([val, label, color]) => (
              <div key={label}>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 11, color: COLORS.grayDark, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kurallar */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Kurallar</div>
          {[
            'Damgalar arası minimum 15 dakika bekleme süresi vardır.',
            'Kahve, blend, kokteyl ve sıcak çikolata damga kazandırır.',
            'Çay, soğuk içecek, kutulu ürünler ve tatlılar damga kazandırmaz.',
            'Her müşteri kendi QR kodundan damga alır.',
            '7 damga = 1 ücretsiz kahve.',
            'Misafir: 0-15 damga | Müdavim: 16-39 damga | GOAT: 40+ damga',
            'GOAT: Aylık 1 ücretsiz kahve + her alışverişte %10 indirim.',
            ...(isGoat ? ['Ödeme öncesinde GOAT üyeliğinizi kasa personeline gösteriniz.'] : []),
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderTop: i > 0 ? `1px solid ${COLORS.grayLight}` : 'none' }}>
              <span style={{ color: COLORS.fioreOrange, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 12, color: COLORS.grayDark, fontWeight: 500, lineHeight: 1.5 }}>{rule}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
