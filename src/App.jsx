import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import CustomerLogin from './pages/customer/CustomerLogin.jsx';
import CustomerApp from './pages/customer/CustomerApp.jsx';
import BusinessLogin from './pages/BusinessLogin.jsx';
import StaffPanel from './pages/staff/StaffPanel.jsx';

const AdminApp = () => {
  const { logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: '#FFF9F3', fontFamily: 'Segoe UI, sans-serif', padding: 20 }}>
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <img src="/icons/logo-header.png" style={{ height: 36 }} />
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 16, color: '#8B5CF6' }}>Admin Paneli</div>
        <div style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Merhaba Mikail</div>
        <div style={{ fontSize: 12, color: '#22C55E', marginTop: 4, fontWeight: 700 }}>{"\u2713 Giri\u015F ba\u015Far\u0131l\u0131"}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 16 }}>{"Admin ekranlar\u0131 Faz 5'te eklenecek"}</div>
        <div onClick={logout} style={{ marginTop: 24, background: '#8B5CF6', color: '#FFF', borderRadius: 14, padding: '14px 24px', fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}>{"\u00C7\u0131k\u0131\u015F Yap"}</div>
      </div>
    </div>
  );
};

function ProtectedRoute({ allowedRole, children }) {
  const { role, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#030303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/icons/logo-header.png" style={{ height: 40, opacity: 0.6 }} />
    </div>
  );
  if (!role || role !== allowedRole) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/musteri/giris" element={<CustomerLogin />} />
      <Route path="/musteri/*" element={<ProtectedRoute allowedRole="customer"><CustomerApp /></ProtectedRoute>} />
      <Route path="/isletme/giris" element={<BusinessLogin />} />
      <Route path="/personel/*" element={<ProtectedRoute allowedRole="staff"><StaffPanel /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin"><AdminApp /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
