import { useNavigate } from 'react-router-dom';
import { COLORS } from '../config/constants.js';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.fioreSiyah,
      fontFamily: "Segoe UI, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 48, objectFit: 'contain' }} />
      <div style={{ fontSize: 14, color: COLORS.fioreOrange, fontStyle: 'italic', fontFamily: 'Georgia, serif', marginTop: 10, letterSpacing: 3 }}>Sei Perfetto</div>
      <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 6, letterSpacing: 2 }}>CAFFEDIFIORE LOYALTY APP</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32, width: '100%', maxWidth: 340 }}>
        <div onClick={() => navigate('/musteri/giris')} style={{
          background: `linear-gradient(135deg, ${COLORS.fioreOrange}, ${COLORS.orangeLight})`,
          borderRadius: 20, padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(236,103,26,0.3)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{"\u2615"}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.fioreBeyaz }}>{"M\u00FC\u015Fteri"}</div>
          <div style={{ fontSize: 10, color: COLORS.fioreBeyaz, opacity: 0.8, marginTop: 4 }}>{"Damga topla, \u00FCcretsiz kahve kazan"}</div>
        </div>
        <div onClick={() => navigate('/isletme/giris')} style={{
          background: `linear-gradient(135deg, ${COLORS.fioreSiyah}, #1a1a2e)`,
          borderRadius: 20, padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
          border: '2px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{"\uD83C\uDFE2"}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.fioreBeyaz }}>{"\u0130\u015Fletme"}</div>
        </div>
      </div>
    </div>
  );
}
