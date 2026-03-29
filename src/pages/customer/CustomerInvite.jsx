import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS } from '../../config/constants.js';

const Card = ({ children, style = {} }) => <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', ...style }}>{children}</div>;

export default function CustomerInvite() {
  const { userData } = useAuth();
  if (!userData) return null;

  const refCode = userData.referralCode || 'DAVET2024';
  const refLink = `caffedifiore.app/davet/${refCode}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CaffeDiFiore Sadakat Programı',
          text: `CaffeDiFiore'da kahve al, damga topla, ücretsiz kahve kazan! Benim davet kodum: ${refCode}`,
          url: `https://${refLink}`,
        });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(`https://${refLink}`);
        alert('Link kopyalandı!');
      } catch (e) {}
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      <div style={{ background: 'linear-gradient(180deg, #3D2B1F, #2A1810)', padding: '16px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><img src="/icons/logo-header.png" alt="" style={{ height: 24 }} /></div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.fioreBeyaz }}>Arkadaşını Davet Et</div>
      </div>

      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.fioreSiyah, lineHeight: 1.4 }}>
          Arkadaşın ilk damgasını alsın,<br />sen 1 bonus damga kazan!
        </div>
        <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 10, lineHeight: 1.6 }}>
          Davet linkini paylaş. Arkadaşın kayıt olup ilk kahvesini aldığında sana otomatik 1 bonus damga eklenir!
        </div>

        {/* Nasıl Çalışır */}
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Nasıl Çalışır?</div>
            {[
              ['📤', 'Davet linkini arkadaşına gönder'],
              ['👤', 'Arkadaşın uygulamaya kayıt olsun'],
              ['☕', 'İlk kahvesini alıp ilk damgasını kazansın'],
              ['🎉', 'Sana otomatik 1 bonus damga eklenir!'],
            ].map(([ic, tx], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i > 0 ? `1px solid ${COLORS.grayLight}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, border: `1.5px solid ${COLORS.fioreOrange}30` }}>{ic}</div>
                <span style={{ fontSize: 13, color: COLORS.grayDark, fontWeight: 500 }}>{tx}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Davet Linki */}
        <div style={{ marginTop: 16 }}>
          <div style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '14px 16px', fontSize: 14, color: COLORS.fioreOrange, fontWeight: 700, border: `2px dashed ${COLORS.fioreOrange}`, wordBreak: 'break-all' }}>
            {refLink}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div onClick={handleShare} style={{ background: COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            📤 Linki Paylaş
          </div>
        </div>

        {/* İstatistik */}
        <div style={{ marginTop: 24 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Davet İstatistiğin</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[
                [userData.referralCount || 0, 'Kayıt Oldu', COLORS.fioreOrange],
                [0, 'İlk Damga', COLORS.blue],
                [0, 'Bonus Kazandın', COLORS.green],
              ].map(([val, label, color]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: COLORS.grayDark, fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
