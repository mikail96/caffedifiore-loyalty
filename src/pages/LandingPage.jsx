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

      <img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 44, opacity: 0.95, marginBottom: 16 }} />
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

      <div style={{ marginTop: 56, textAlign: 'center' }}>
        <div onClick={() => navigate('/isletme/giris')} style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '8px 16px' }}>İşletme Girişi →</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)', marginTop: 12 }}>CaffeDiFiore © 2016</div>
      </div>
    </div>
  );
}
