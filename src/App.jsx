import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';

// Placeholder components - Faz 2-5'te gerçek componentler gelecek
const CustomerLogin = () => <div style={{ padding: 40, textAlign: 'center', color: '#EC671A' }}>Müşteri Giriş - Faz 2'de gelecek</div>;
const CustomerHome = () => <div style={{ padding: 40, textAlign: 'center', color: '#EC671A' }}>Müşteri Ana Sayfa - Faz 3'te gelecek</div>;
const BusinessLogin = () => <div style={{ padding: 40, textAlign: 'center', color: '#3B82F6' }}>İşletme Giriş - Faz 2'de gelecek</div>;
const StaffPanel = () => <div style={{ padding: 40, textAlign: 'center', color: '#3B82F6' }}>Personel Panel - Faz 4'te gelecek</div>;
const AdminPanel = () => <div style={{ padding: 40, textAlign: 'center', color: '#8B5CF6' }}>Admin Panel - Faz 5'te gelecek</div>;

function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      {/* Landing - herkes görür */}
      <Route path="/" element={<LandingPage />} />

      {/* Müşteri */}
      <Route path="/musteri/giris" element={<CustomerLogin />} />
      <Route path="/musteri/*" element={<CustomerHome />} />

      {/* İşletme (Personel + Admin) */}
      <Route path="/isletme/giris" element={<BusinessLogin />} />
      <Route path="/personel/*" element={<StaffPanel />} />
      <Route path="/admin/*" element={<AdminPanel />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          minHeight: '100vh',
          fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
        }}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
