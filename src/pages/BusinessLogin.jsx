import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext.jsx';
import { COLORS, FONTS } from '../config/constants.js';

const f = FONTS;

export default function BusinessLogin() {
  const navigate = useNavigate();
  const { loginAsStaff, loginAsAdmin } = useAuth();
  const [tab, setTab] = useState('staff');
  const [staffUser, setStaffUser] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStaffLogin = async () => {
    if (!staffUser.trim() || !staffPin.trim()) { setError('Kullanıcı adı ve PIN girin'); return; }
    if (staffPin.length !== 4) { setError('PIN 4 haneli olmalıdır'); return; }
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'staff'), where('username', '==', staffUser.trim().toLowerCase()), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { setError('Kullanıcı bulunamadı'); setLoading(false); return; }
      const staffDoc = snapshot.docs[0];
      const staffData = { id: staffDoc.id, ...staffDoc.data() };
      if (staffData.pin !== staffPin) { setError('PIN hatalı'); setLoading(false); return; }
      await loginAsStaff(staffData);
      navigate('/personel');
    } catch (err) { setError('Giriş sırasında hata oluştu'); }
    setLoading(false);
  };

  const handleAdminLogin = async () => {
    if (!adminUser.trim() || !adminPass.trim()) { setError('Kullanıcı adı ve şifre girin'); return; }
    setLoading(true); setError('');
    try {
      const { doc: docRef, getDoc: getDocFn } = await import('firebase/firestore');
      const settingsDoc = await getDocFn(docRef(db, 'settings', 'admin'));
      if (!settingsDoc.exists()) { setError('Admin ayarları bulunamadı'); setLoading(false); return; }
      const adminData = settingsDoc.data();
      if (adminUser.trim() !== adminData.username || adminPass !== adminData.password) { setError('Kullanıcı adı veya şifre hatalı'); setLoading(false); return; }
      await loginAsAdmin({ ...adminData, role: 'admin' });
      navigate('/admin');
    } catch (err) { setError('Giriş sırasında hata oluştu'); }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: `1.5px solid ${COLORS.divider}`, fontSize: 14, color: COLORS.fioreBeyaz,
    boxSizing: 'border-box', background: COLORS.warmGray, outline: 'none', fontFamily: f.body,
  };

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at 50% 30%, #1A1410 0%, ${COLORS.cream} 70%)`, fontFamily: f.body }}>
      <div style={{ padding: '50px 24px 24px', textAlign: 'center' }}>
        <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 38, opacity: 0.95 }} />
        <div style={{ fontSize: 13, color: COLORS.fioreOrange, fontFamily: FONTS.script, marginTop: 10, letterSpacing: 2 }}>Sei Perfetto</div>
      </div>

      <div style={{ background: COLORS.cardBg, borderRadius: '28px 28px 0 0', minHeight: 'calc(100vh - 150px)', padding: '28px 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: COLORS.fioreBeyaz }}>İşletme Girişi</div>
        <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 22 }}>Personel veya Admin olarak giriş yap</div>

        {/* Tab seçimi */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[['staff', 'Personel'], ['admin', 'Admin']].map(([k, l]) => (
            <div key={k} onClick={() => { setTab(k); setError(''); }} style={{
              flex: 1, padding: '12px', borderRadius: 50, textAlign: 'center',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: tab === k ? COLORS.fioreSiyah : COLORS.warmGray,
              color: tab === k ? COLORS.fioreBeyaz : COLORS.grayDark,
              transition: 'all 0.2s',
            }}>{l}</div>
          ))}
        </div>

        {/* Personel */}
        {tab === 'staff' && <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Kullanıcı Adı</div>
            <input placeholder="kullanıcı adı" value={staffUser} onChange={e => setStaffUser(e.target.value)} style={inputStyle} autoCapitalize="off" autoCorrect="off" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>PIN Kodu (4 hane)</div>
            <input type="password" placeholder="● ● ● ●" value={staffPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setStaffPin(e.target.value); }} style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 20 }} maxLength={4} inputMode="numeric" />
          </div>

          {error && <div style={{ background: 'rgba(217,68,68,0.06)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, borderLeft: `3px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div onClick={loading ? undefined : handleStaffLogin} style={{ background: loading ? COLORS.warmGray : COLORS.fioreOrange, color: '#fff', borderRadius: 50, padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: COLORS.gray }}>
            PIN'ini mi unuttun? <span style={{ color: COLORS.fioreOrange, fontWeight: 700 }}>Yöneticine sor</span>
          </div>
        </>}

        {/* Admin */}
        {tab === 'admin' && <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Kullanıcı Adı</div>
            <input placeholder="admin kullanıcı adı" value={adminUser} onChange={e => setAdminUser(e.target.value)} style={inputStyle} autoCapitalize="off" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Şifre</div>
            <input type="password" placeholder="••••••••" value={adminPass} onChange={e => setAdminPass(e.target.value)} style={inputStyle} />
          </div>

          {error && <div style={{ background: 'rgba(217,68,68,0.06)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, borderLeft: `3px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div onClick={loading ? undefined : handleAdminLogin} style={{ background: loading ? COLORS.grayLight : COLORS.fioreSiyah, color: COLORS.fioreBeyaz, borderRadius: 50, padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Giriş yapılıyor...' : 'Admin Girişi'}
          </div>
        </>}

        <div onClick={() => navigate('/')} style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: COLORS.gray, cursor: 'pointer' }}>← Ana Sayfa</div>
      </div>
    </div>
  );
}
