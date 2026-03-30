import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS, FONTS } from '../../config/constants.js';

const f = FONTS;
const CopyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const ShareIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>;

export default function CustomerInvite() {
  const { userData } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!userData) return null;
  const refCode = userData.referralCode || 'DAVET';

  const handleCopy = async () => { try { await navigator.clipboard.writeText(refCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} };
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'CaffeDiFiore', text: `CaffeDiFiore'da kahve al, damga topla, ücretsiz kahve kazan! Davet kodum: ${refCode}` }); } catch (e) {}
    } else handleCopy();
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      <div style={{ background: 'linear-gradient(160deg, #3D2B1F, #2A1810)', padding: '20px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><img src="/icons/logo-header.png" alt="" style={{ height: 24 }} /></div>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.fioreBeyaz, fontFamily: f.heading }}>Davet Et</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Arkadaşını davet et, bonus kazan</div>
      </div>

      <div style={{ padding: '20px 20px', textAlign: 'center' }}>
        {/* Davet Kodu */}
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '28px 24px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Davet Kodun</div>
          <div style={{
            fontSize: 32, fontWeight: 700, color: COLORS.fioreOrange,
            letterSpacing: 6, fontFamily: f.heading,
            padding: '14px 0', borderTop: `1px solid ${COLORS.warmGray}`, borderBottom: `1px solid ${COLORS.warmGray}`,
          }}>
            {refCode}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
            <div onClick={handleCopy} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: copied ? COLORS.green : COLORS.fioreSiyah,
              color: COLORS.fioreBeyaz, borderRadius: 12, padding: '12px 20px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </div>
            <div onClick={handleShare} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: COLORS.fioreOrange, color: COLORS.fioreBeyaz,
              borderRadius: 12, padding: '12px 20px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              <ShareIcon /> Paylaş
            </div>
          </div>
        </div>

        {/* Nasıl Çalışır */}
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)', marginBottom: 16, textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, fontFamily: f.heading }}>Nasıl Çalışır?</div>
          {[
            ['1', 'Davet kodunu kopyala ve arkadaşına gönder'],
            ['2', 'Arkadaşın kayıt olurken kodunu girsin'],
            ['3', 'İlk kahvesini alıp damgasını kazansın'],
            ['4', 'Sana otomatik 1 bonus damga eklenir'],
          ].map(([n, tx], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i ? `1px solid ${COLORS.warmGray}` : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: COLORS.fioreOrange, flexShrink: 0 }}>{n}</div>
              <span style={{ fontSize: 13, color: COLORS.grayDark, fontWeight: 500, lineHeight: 1.5 }}>{tx}</span>
            </div>
          ))}
        </div>

        {/* İstatistik */}
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, fontFamily: f.heading }}>Davet İstatistiğin</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              [userData.referralCount || 0, 'Kayıt Oldu', COLORS.fioreOrange],
              [0, 'Bonus Damga', COLORS.green],
            ].map(([val, label, color]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: f.heading }}>{val}</div>
                <div style={{ fontSize: 11, color: COLORS.gray, fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
