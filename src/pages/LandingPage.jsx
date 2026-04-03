import { useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from '../config/constants.js';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', fontFamily: FONTS.body,
      background: `radial-gradient(ellipse at 50% 30%, #1A1410 0%, ${COLORS.cream} 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '15%', left: -40, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(236,103,26,0.04)' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: -30, width: 90, height: 90, borderRadius: '50%', border: '1px solid rgba(236,103,26,0.05)' }} />

      <img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 55, marginBottom: 16 }} />
      <div style={{ fontFamily: FONTS.script, fontSize: 30, color: COLORS.fioreOrange, fontWeight: 700, marginBottom: 48, textShadow: '0 0 30px rgba(236,103,26,0.15)' }}>Sei Perfetto</div>

      <div style={{ width: '100%', maxWidth: 300 }}>
        <div onClick={() => navigate('/musteri/giris')} style={{
          background: COLORS.fioreOrange, borderRadius: 50, padding: '17px', textAlign: 'center',
          fontWeight: 700, fontSize: 16, color: '#fff', cursor: 'pointer', marginBottom: 12,
          boxShadow: '0 4px 24px rgba(236,103,26,0.3)',
        }}>Giriş Yap</div>
        <div onClick={() => navigate('/musteri/giris', { state: { mode: 'register' } })} style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: '17px', textAlign: 'center',
          fontWeight: 700, fontSize: 16, color: COLORS.fioreBeyaz, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>Kayıt Ol</div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }} onClick={() => window.open('https://www.instagram.com/caffedifiore.tr?igsh=MWFvZnB4dXphYXY1cA==', '_blank')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>@caffedifiore.tr</span>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <div onClick={() => navigate('/isletme/giris')} style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '8px 16px' }}>İşletme Girişi →</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)', marginTop: 12 }}>CaffeDiFiore © 2016</div>
      </div>
    </div>
  );
}
