import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS, FONTS } from '../../config/constants.js';
import { requestNotificationPermission, onForegroundMessage, isNotificationSupported, getNotificationStatus } from '../../services/notificationService.js';
import CustomerHome from './CustomerHome.jsx';
import CustomerMenu from './CustomerMenu.jsx';
import CustomerProfile from './CustomerProfile.jsx';
import CustomerInvite from './CustomerInvite.jsx';

const HomeIcon = ({ color }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>;
const MenuIcon = ({ color }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
const GiftIcon = ({ color }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><rect x="3" y="12" width="18" height="8" rx="1"/><path d="M12 8v12M7.5 8C6.1 8 5 6.9 5 5.5S6.1 3 7.5 3c2 0 3.5 2.5 4.5 5M16.5 8C17.9 8 19 6.9 19 5.5S17.9 3 16.5 3c-2 0-3.5 2.5-4.5 5"/></svg>;
const UserIcon = ({ color }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const tabs = [
  { id: 'home', label: 'Ana Sayfa', Icon: HomeIcon },
  { id: 'menu', label: 'Menü', Icon: MenuIcon },
  { id: 'invite', label: 'Davet Et', Icon: GiftIcon },
  { id: 'profile', label: 'Profilim', Icon: UserIcon },
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
        background: COLORS.cardBg, borderTop: `1px solid ${COLORS.divider}`,
        display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px',
        zIndex: 100,
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          const color = active ? (isGoat ? COLORS.gold : COLORS.fioreOrange) : COLORS.gray;
          return (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ textAlign: 'center', cursor: 'pointer', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><tab.Icon color={color} /></div>
              <div style={{ fontSize: 10, fontWeight: active ? 700 : 500, color, marginTop: 4, fontFamily: FONTS.body }}>{tab.label}</div>
            </div>
          );
        })}
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
