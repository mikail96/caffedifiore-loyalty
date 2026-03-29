import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS } from '../../config/constants.js';

const Card = ({ children, style = {} }) => <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', ...style }}>{children}</div>;

export default function CustomerInvite() {
  const { userData } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!userData) return null;

  const refCode = userData.referralCode || 'DAVET2024';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CaffeDiFiore Sadakat Programı',
          text: `CaffeDiFiore'da kahve al, damga topla, ücretsiz kahve kazan! Kayıt olurken benim davet kodumu gir: ${refCode}`,
        });
      } catch (e) {}
    } else {
      handleCopy();
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
          Davet kodunu paylaş,<br />bonus damga kazan!
        </div>

        {/* Davet Kodu */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 8 }}>Senin Davet Kodun:</div>
          <div style={{
            background: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px 20px',
            fontSize: 28, fontWeight: 800, color: COLORS.fioreOrange,
            letterSpacing: 4, border: `2.5px solid ${COLORS.fioreOrange}`,
            boxShadow: '0 2px 12px rgba(236,103,26,0.15)',
          }}>
            {refCode}
          </div>
          <div
            onClick={handleCopy}
            style={{
              marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: copied ? COLORS.green : COLORS.fioreSiyah,
              color: COLORS.fioreBeyaz, borderRadius: 10, padding: '10px 20px',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Kopyalandı!' : '📋 Kodu Kopyala'}
          </div>
        </div>

        {/* Nasıl Çalışır */}
        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Nasıl Çalışır?</div>
            {[
              ['📋', 'Davet kodunu kopyala ve arkadaşına gönder'],
              ['👤', 'Arkadaşın uygulamaya kayıt olurken kodu girsin'],
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

        {/* WhatsApp / Paylaş */}
        <div style={{ marginTop: 16 }}>
          <div onClick={handleShare} style={{ background: COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            📤 Arkadaşına Gönder
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
