import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS } from '../../config/constants.js';
import { requestNotificationPermission, onForegroundMessage, isNotificationSupported, getNotificationStatus } from '../../services/notificationService.js';
import CustomerHome from './CustomerHome.jsx';
import CustomerMenu from './CustomerMenu.jsx';
import CustomerProfile from './CustomerProfile.jsx';
import CustomerInvite from './CustomerInvite.jsx';

const tabs = [
  { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
  { id: 'menu', label: 'Menü', icon: '📋' },
  { id: 'invite', label: 'Davet Et', icon: '🎁' },
  { id: 'profile', label: 'Profilim', icon: '👤' },
];

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const { logout, userData, user } = useAuth();
  const isGoat = userData?.level === 'goat';
  const [notifBanner, setNotifBanner] = useState(null);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Bildirim izni ve token kayıt
  useEffect(() => {
    if (!user?.uid) return;
    const status = getNotificationStatus();
    if (status === 'granted') {
      // İzin zaten verilmiş — token'ı güncelle
      requestNotificationPermission(user.uid);
    } else if (status === 'default' && isNotificationSupported()) {
      const timer = setTimeout(() => setShowNotifPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Foreground bildirim dinle
  useEffect(() => {
    const unsub = onForegroundMessage((data) => {
      setNotifBanner(data);
      setTimeout(() => setNotifBanner(null), 5000);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const handleAllowNotif = async () => {
    await requestNotificationPermission(user?.uid);
    setShowNotifPrompt(false);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <CustomerHome />;
      case 'menu': return <CustomerMenu />;
      case 'invite': return <CustomerInvite />;
      case 'profile': return <CustomerProfile />;
      default: return <CustomerHome />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60, position: 'relative' }}>
      {/* Bildirim izin promptu */}
      {showNotifPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: '12px 16px', background: 'linear-gradient(135deg, #3D2B1F, #2A1810)', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreBeyaz }}>Bildirimleri Aç</div>
            <div style={{ fontSize: 11, color: COLORS.gray }}>Kampanya ve fırsatlardan haberdar ol!</div>
          </div>
          <div onClick={handleAllowNotif} style={{ background: COLORS.fioreOrange, color: COLORS.fioreBeyaz, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Aç</div>
          <div onClick={() => setShowNotifPrompt(false)} style={{ color: COLORS.gray, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</div>
        </div>
      )}

      {/* In-app bildirim banner */}
      {notifBanner && (
        <div style={{ position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: COLORS.fioreOrange, color: COLORS.fioreBeyaz, padding: '14px 20px', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 360, width: '90%' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{notifBanner.title || 'CaffeDiFiore'}</div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>{notifBanner.body}</div>
        </div>
      )}

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
