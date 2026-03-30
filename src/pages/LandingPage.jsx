import { useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from '../config/constants.js';

const f = FONTS;
const CoffeeIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M6 2v3M10 2v3M14 2v3"/></svg>;
const StoreIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(170deg, #3D2B1F 0%, #1a1208 50%, #0d0906 100%)',
      fontFamily: f.body, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 44, opacity: 0.95 }} />
      <div style={{ fontSize: 14, color: COLORS.fioreOrange, fontStyle: 'italic', fontFamily: f.heading, marginTop: 12, letterSpacing: 2, opacity: 0.8 }}>Sei Perfetto</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8, letterSpacing: 3, fontWeight: 600 }}>LOYALTY PROGRAM</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 40, width: '100%', maxWidth: 340 }}>
        <div onClick={() => navigate('/musteri/giris')} style={{
          background: COLORS.fioreOrange, borderRadius: 20, padding: '32px 16px',
          textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -15, top: -15, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ marginBottom: 12 }}><CoffeeIcon /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.fioreBeyaz, fontFamily: f.heading }}>Müşteri</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.4 }}>Damga topla, kahve kazan</div>
        </div>
        <div onClick={() => navigate('/isletme/giris')} style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 16px',
          textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ marginBottom: 12 }}><StoreIcon /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.fioreBeyaz, fontFamily: f.heading }}>İşletme</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.4 }}>Personel & Yönetim</div>
        </div>
      </div>

      <div style={{ marginTop: 48, fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: 1 }}>CaffeDiFiore © 2016</div>
    </div>
  );
}
