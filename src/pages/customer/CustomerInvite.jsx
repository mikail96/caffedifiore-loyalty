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
    } catch (e) {
      // Fallback
      const el = document.createElement('textarea');
      el.value = refCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareText = `CaffeDiFiore'da kahve al, damga topla, ücretsiz kahve kazan! Kayıt olurken benim davet kodumu gir: ${refCode}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'CaffeDiFiore Davet', text: shareText }); } catch (e) {}
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
          Arkadaşına davet kodunu gönder,<br />bonus damga kazan!
        </div>

        {/* Davet Kodu */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 8 }}>SENİN DAVET KODUN</div>
          <div style={{
            background: COLORS.fioreBeyaz, borderRadius: 16, padding: '18px 20px',
            border: `2.5px solid ${COLORS.fioreOrange}`, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(236,103,26,0.15)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.fioreOrange, letterSpacing: 4 }}>{refCode}</div>
            <div
              onClick={handleCopy}
              style={{
                background: copied ? COLORS.green : COLORS.fioreOrange,
                color: COLORS.fioreBeyaz, borderRadius: 10,
                padding: '8px 16px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0, marginLeft: 12,
                transition: 'background 0.2s',
              }}
            >
              {copied ? '✓ Kopyalandı!' : '📋 Kopyala'}
            </div>
          </div>
        </div>

        {/* Nasıl Çalışır */}
        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Nasıl Çalışır?</div>
            {[
              ['1️⃣', 'Davet kodunu kopyala ve arkadaşına gönder'],
              ['2️⃣', 'Arkadaşın uygulamaya kayıt olurken kodunu girsin'],
              ['3️⃣', 'İlk kahvesini alıp damgasını kazansın'],
              ['🎉', 'Sana otomatik 1 bonus damga eklenir!'],
            ].map(([ic, tx], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${COLORS.grayLight}` : 'none' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{ic}</span>
                <span style={{ fontSize: 13, color: COLORS.grayDark, fontWeight: 500, lineHeight: 1.4 }}>{tx}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Paylaş Butonu */}
        <div style={{ marginTop: 16 }}>
          <div onClick={handleShare} style={{
            background: COLORS.fioreOrange, color: COLORS.fioreBeyaz,
            borderRadius: 14, padding: '16px', textAlign: 'center',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>
            📤 Kodu Arkadaşına Gönder
          </div>
        </div>

        {/* İstatistik */}
        <div style={{ marginTop: 24 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Davet İstatistiğin</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[
                [userData.referralCount || 0, 'Davet Edildi', COLORS.fioreOrange],
                [0, 'Bonus Damga', COLORS.green],
              ].map(([val, label, color]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
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
