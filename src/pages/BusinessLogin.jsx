import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLORS } from '../../config/constants.js';

export default function BusinessLogin() {
  const navigate = useNavigate();
  const { loginAsStaff, loginAsAdmin } = useAuth();
  const [tab, setTab] = useState('staff'); // staff | admin
  const [staffUser, setStaffUser] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Personel girişi
  const handleStaffLogin = async () => {
    if (!staffUser.trim() || !staffPin.trim()) {
      setError('Kullanıcı adı ve PIN girin');
      return;
    }
    if (staffPin.length !== 4) {
      setError('PIN 4 haneli olmalıdır');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Firestore'dan personel ara
      const q = query(
        collection(db, 'staff'),
        where('username', '==', staffUser.trim().toLowerCase()),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Kullanıcı bulunamadı');
        setLoading(false);
        return;
      }

      const staffDoc = snapshot.docs[0];
      const staffData = { id: staffDoc.id, ...staffDoc.data() };

      // PIN kontrolü (gerçek uygulamada bcrypt hash karşılaştırması olacak)
      // Şimdilik düz karşılaştırma — Faz 6'da hash'lenecek
      if (staffData.pin !== staffPin) {
        setError('PIN hatalı');
        // TODO: Brute-force koruması — 5 yanlışta 15dk kilit
        setLoading(false);
        return;
      }

      await loginAsStaff(staffData);
      navigate('/personel');
    } catch (err) {
      console.error('Staff login error:', err);
      setError('Giriş sırasında hata oluştu');
    }
    setLoading(false);
  };

  // Admin girişi
  const handleAdminLogin = async () => {
    if (!adminUser.trim() || !adminPass.trim()) {
      setError('Kullanıcı adı ve şifre girin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Firestore settings'den admin bilgilerini al
      // Gerçek uygulamada: şifre hash + SMS doğrulama
      // Şimdilik basit kontrol — Faz 6'da SMS eklenecek
      const { doc: docRef, getDoc: getDocFn } = await import('firebase/firestore');
      const settingsDoc = await getDocFn(docRef(db, 'settings', 'admin'));

      if (!settingsDoc.exists()) {
        setError('Admin ayarları bulunamadı');
        setLoading(false);
        return;
      }

      const adminData = settingsDoc.data();

      if (adminUser.trim() !== adminData.username || adminPass !== adminData.password) {
        setError('Kullanıcı adı veya şifre hatalı');
        setLoading(false);
        return;
      }

      // TODO: Faz 6'da SMS doğrulama eklenecek (+905358841480)
      await loginAsAdmin({ ...adminData, role: 'admin' });
      navigate('/admin');
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Giriş sırasında hata oluştu');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1.5px solid ${COLORS.grayLight}`,
    fontSize: 14,
    boxSizing: 'border-box',
    background: COLORS.cream,
    outline: 'none',
  };

  const tabColor = tab === 'staff' ? COLORS.blue : COLORS.purple;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.fioreSiyah, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '50px 24px 24px', textAlign: 'center' }}>
        <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 40 }} />
        <div style={{ fontSize: 13, color: COLORS.fioreOrange, fontStyle: 'italic', fontFamily: 'Georgia, serif', marginTop: 8, letterSpacing: 2 }}>Sei Perfetto</div>
      </div>

      {/* Content card */}
      <div style={{ background: COLORS.fioreBeyaz, borderRadius: '24px 24px 0 0', minHeight: 'calc(100vh - 140px)', padding: '24px' }}>

        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>İşletme Girişi</div>
        <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 20 }}>Personel veya Admin olarak giriş yap</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div
            onClick={() => { setTab('staff'); setError(''); }}
            style={{
              flex: 1, padding: '12px', borderRadius: 14, textAlign: 'center',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: tab === 'staff' ? COLORS.blue : COLORS.warmGray,
              color: tab === 'staff' ? COLORS.fioreBeyaz : COLORS.grayDark,
            }}
          >
            👨‍🍳 Personel
          </div>
          <div
            onClick={() => { setTab('admin'); setError(''); }}
            style={{
              flex: 1, padding: '12px', borderRadius: 14, textAlign: 'center',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: tab === 'admin' ? COLORS.purple : COLORS.warmGray,
              color: tab === 'admin' ? COLORS.fioreBeyaz : COLORS.grayDark,
            }}
          >
            🔐 Admin
          </div>
        </div>

        {/* Staff Login */}
        {tab === 'staff' && <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Kullanıcı Adı</div>
            <input
              placeholder="elif.arslan"
              value={staffUser}
              onChange={e => setStaffUser(e.target.value)}
              style={inputStyle}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>PIN Kodu (4 hane)</div>
            <input
              type="password"
              placeholder="● ● ● ●"
              value={staffPin}
              onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setStaffPin(e.target.value); }}
              style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 20 }}
              maxLength={4}
              inputMode="numeric"
            />
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div
            onClick={loading ? undefined : handleStaffLogin}
            style={{ background: loading ? COLORS.grayLight : COLORS.blue, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Giriş yapılıyor...' : '🔓 Giriş Yap'}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: COLORS.gray }}>
            PIN'ini mi unuttun? <span style={{ color: COLORS.blue, fontWeight: 700 }}>Yöneticine sor</span>
          </div>
        </>}

        {/* Admin Login */}
        {tab === 'admin' && <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Kullanıcı Adı</div>
            <input
              placeholder="admin kullanıcı adı"
              value={adminUser}
              onChange={e => setAdminUser(e.target.value)}
              style={inputStyle}
              autoCapitalize="off"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Şifre</div>
            <input
              type="password"
              placeholder="••••••••"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ background: 'rgba(139,92,246,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid rgba(139,92,246,0.2)` }}>
            <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 600 }}>
              🔒 Giriş sonrası SMS doğrulama yapılacaktır
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div
            onClick={loading ? undefined : handleAdminLogin}
            style={{ background: loading ? COLORS.grayLight : COLORS.purple, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Giriş yapılıyor...' : '🔐 Admin Girişi'}
          </div>
        </>}

        <div onClick={() => navigate('/')} style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: COLORS.gray, cursor: 'pointer' }}>← Ana Sayfaya Dön</div>
      </div>
    </div>
  );
}
