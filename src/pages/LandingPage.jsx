import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../config/constants.js';
import logo from '/icons/logo-header.png';

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
      {/* Logo */}
      <img src={logo} alt="CaffeDiFiore" style={{ height: 48, objectFit: 'contain' }} />

      {/* Sei Perfetto */}
      <div style={{
        fontSize: 14,
        color: COLORS.fioreOrange,
        fontStyle: 'italic',
        fontFamily: 'Georgia, serif',
        marginTop: 10,
        letterSpacing: 3,
      }}>
        Sei Perfetto
      </div>

      {/* App name */}
      <div style={{
        fontSize: 10,
        color: COLORS.gray,
        marginTop: 6,
        letterSpacing: 2,
      }}>
        CAFFEDIFIORE LOYALTY APP
      </div>

      {/* Two grid buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginTop: 32,
        width: '100%',
        maxWidth: 340,
      }}>
        {/* Müşteri */}
        <div
          onClick={() => navigate('/musteri/giris')}
          style={{
            background: `linear-gradient(135deg, ${COLORS.fioreOrange}, ${COLORS.orangeLight})`,
            borderRadius: 20,
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(236,103,26,0.3)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>☕</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.fioreBeyaz }}>Müşteri</div>
          <div style={{ fontSize: 10, color: COLORS.fioreBeyaz, opacity: 0.8, marginTop: 4, lineHeight: 1.4 }}>
            Damga topla, ücretsiz kahve kazan
          </div>
        </div>

        {/* İşletme */}
        <div
          onClick={() => navigate('/isletme/giris')}
          style={{
            background: `linear-gradient(135deg, ${COLORS.fioreSiyah}, #1a1a2e)`,
            borderRadius: 20,
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.fioreBeyaz }}>İşletme</div>
          {/* Alt yazı YOK - tasarım kararı */}
        </div>
      </div>
    </div>
  );
}
