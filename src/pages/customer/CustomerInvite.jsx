import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS, FONTS } from '../../config/constants.js';

const f = FONTS;
const CopyI = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const ShareI = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
const CheckI = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>;

export default function CustomerInvite() {
  const { userData } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!userData) return null;
  const refCode = userData.referralCode || 'DAVET';
  const handleCopy = async () => { try { await navigator.clipboard.writeText(refCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch(e){} };
  const handleShare = async () => { if (navigator.share) { try { await navigator.share({ title: 'CaffeDiFiore', text: `CaffeDiFiore'da damga topla, ücretsiz kahve kazan! Davet kodum: ${refCode}` }); } catch(e){} } else handleCopy(); };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: COLORS.cream, fontFamily: f.body, overscrollBehavior: 'none' }}>
      <div style={{ background: COLORS.headerGradient, padding: '20px 20px 16px', borderBottom: `1px solid ${COLORS.divider}` }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}><img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 20, opacity: 0.85 }} /></div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.fioreBeyaz }}>Davet Et</div>
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>Arkadaşını davet et, bonus kazan</div>
      </div>
      <div style={{ padding: '16px 16px', textAlign: 'center' }}>
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '24px 20px', border: `1px solid ${COLORS.divider}`, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray, letterSpacing: 2, marginBottom: 12 }}>DAVET KODUN</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.fioreOrange, letterSpacing: 6, padding: '12px 0', borderTop: `1px solid ${COLORS.divider}`, borderBottom: `1px solid ${COLORS.divider}` }}>{refCode}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
            <div onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied?COLORS.green:COLORS.warmGray, color: copied?'#fff':COLORS.grayDark, padding: '10px 18px', borderRadius: 50, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{copied?<CheckI />:<CopyI />}{copied?'Kopyalandı':'Kopyala'}</div>
            <div onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.fioreOrange, color: '#fff', padding: '10px 18px', borderRadius: 50, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}><ShareI /> Paylaş</div>
          </div>
        </div>
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, textAlign: 'left', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>Nasıl Çalışır?</div>
          {['Davet kodunu kopyala ve arkadaşına gönder','Arkadaşın kayıt olurken kodunu girsin','İlk kahvesini alıp damgasını kazansın','Sana otomatik 1 bonus damga eklenir'].map((t,i)=>(
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i?`1px solid ${COLORS.divider}`:'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: COLORS.fioreOrange, flexShrink: 0 }}>{i+1}</div>
              <span style={{ fontSize: 13, color: COLORS.grayDark, fontWeight: 500, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>Davet İstatistiğin</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[[userData.referralCount||0,'Kayıt Oldu',COLORS.fioreOrange],[0,'Bonus Damga',COLORS.green]].map(([v,l,c])=>(
              <div key={l} style={{ textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
