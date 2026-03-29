import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS } from '../../config/constants.js';
import CustomerHome from './CustomerHome.jsx';
import CustomerMenu from './CustomerMenu.jsx';
import CustomerProfile from './CustomerProfile.jsx';

const tabs = [
  { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
  { id: 'menu', label: 'Menü', icon: '📋' },
  { id: 'invite', label: 'Davet Et', icon: '🎁' },
  { id: 'profile', label: 'Profilim', icon: '👤' },
];

// Placeholder - Faz 3 devamında gelecek
const InvitePage = () => (
  <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, sans-serif" }}>
    <div style={{ background: COLORS.fioreSiyah, padding: '16px 20px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><img src="/icons/logo-header.png" style={{ height: 24 }} /></div>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.fioreBeyaz }}>Arkadaşını Davet Et</div>
    </div>
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>Yakında!</div>
      <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 8 }}>Davet sistemi yakında aktif olacak.</div>
    </div>
  </div>
);

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const { logout, userData } = useAuth();
  const isGoat = userData?.level === 'goat';

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <CustomerHome />;
      case 'menu': return <CustomerMenu />;
      case 'invite': return <InvitePage />;
      case 'profile': return <CustomerProfile />;
      default: return <CustomerHome />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60, position: 'relative' }}>
      {renderPage()}

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: COLORS.fioreBeyaz, borderTop: `2px solid ${COLORS.grayLight}`,
        display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px',
        zIndex: 100,
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ textAlign: 'center', cursor: 'pointer', flex: 1 }}
          >
            <div style={{ fontSize: 20 }}>{tab.icon}</div>
            <div style={{
              fontSize: 10, fontWeight: activeTab === tab.id ? 800 : 500,
              color: activeTab === tab.id ? (isGoat ? COLORS.gold : COLORS.fioreOrange) : COLORS.gray,
              marginTop: 2,
            }}>{tab.label}</div>
          </div>
        ))}
      </div>

      {/* Çıkış butonu - header'da */}
      <div
        onClick={logout}
        style={{
          position: 'fixed', top: 16, right: 16,
          fontSize: 11, color: COLORS.gray, cursor: 'pointer',
          background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 8,
          zIndex: 101,
        }}
      >
        Çıkış
      </div>
    </div>
  );
}
