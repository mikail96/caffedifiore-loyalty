import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext.jsx';
import { COLORS, FONTS } from '../config/constants.js';
import { hashPin } from '../utils/helpers.js';

const f = FONTS;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const ADMIN_EMAIL_DOMAIN = 'caffedifiore-loyalty.firebaseapp.com';

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

  const checkBruteForce = async (identifier) => {
    try {
      const snap = await getDoc(doc(db, 'loginAttempts', identifier));
      if (snap.exists()) {
        const data = snap.data();
        if (data.locked && data.lockedUntil?.seconds > Date.now() / 1000) {
          const remaining = Math.ceil((data.lockedUntil.seconds - Date.now() / 1000) / 60);
          return `Çok fazla yanlış deneme. ${remaining} dk bekleyin.`;
        }
      }
    } catch (e) {}
    return null;
  };

  const recordAttempt = async (identifier, success) => {
    try {
      const ref = doc(db, 'loginAttempts', identifier);
      const snap = await getDoc(ref);
      if (success) {
        await updateDoc(ref, { attempts: 0, locked: false }).catch(() => {});
        return;
      }
      const current = snap.exists() ? (snap.data().attempts || 0) : 0;
      const newCount = current + 1;
      const data = { attempts: newCount, lastAttempt: serverTimestamp(), locked: newCount >= MAX_ATTEMPTS };
      if (newCount >= MAX_ATTEMPTS) data.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
      if (snap.exists()) await updateDoc(ref, data);
      else await addDoc(collection(db, 'loginAttempts'), { ...data }); // fallback
    } catch (e) {}
  };

  const handleStaffLogin = async () => {
    if (!staffUser.trim() || !staffPin.trim()) { setError('Kullanıcı adı ve PIN girin'); return; }
    if (staffPin.length !== 4) { setError('PIN 4 haneli olmalıdır'); return; }
    setLoading(true); setError('');

    // Brute-force kontrolü
    const lockMsg = await checkBruteForce('staff_' + staffUser.trim().toLowerCase());
    if (lockMsg) { setError(lockMsg); setLoading(false); return; }

    try {
      const q = query(collection(db, 'staff'), where('username', '==', staffUser.trim().toLowerCase()), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { setError('Kullanıcı bulunamadı'); await recordAttempt('staff_' + staffUser.trim().toLowerCase(), false); setLoading(false); return; }
      const staffDoc = snapshot.docs[0];
      const staffData = { id: staffDoc.id, ...staffDoc.data() };

      // PIN kontrolü: hash karşılaştır, düz metin fallback + otomatik migration
      const hashedPin = await hashPin(staffPin);
      if (staffData.pin === hashedPin) {
        // Zaten hashli, eşleşti
      } else if (staffData.pin === staffPin) {
        // Düz metin eşleşti — hash'e migrate et
        await updateDoc(doc(db, 'staff', staffDoc.id), { pin: hashedPin });
      } else {
        setError('PIN hatalı');
        await recordAttempt('staff_' + staffUser.trim().toLowerCase(), false);
        setLoading(false); return;
      }

      await recordAttempt('staff_' + staffUser.trim().toLowerCase(), true);
      await loginAsStaff(staffData);
      navigate('/personel');
    } catch (err) { setError('Giriş sırasında hata oluştu'); }
    setLoading(false);
  };

  const handleAdminLogin = async () => {
    if (!adminUser.trim() || !adminPass.trim()) { setError('Kullanıcı adı ve şifre girin'); return; }
    setLoading(true); setError('');

    const lockMsg = await checkBruteForce('admin_' + adminUser.trim());
    if (lockMsg) { setError(lockMsg); setLoading(false); return; }

    const email = `${adminUser.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;

    try {
      // 1) Firebase Auth ile dene
      await signInWithEmailAndPassword(auth, email, adminPass);
      await recordAttempt('admin_' + adminUser.trim(), true);
      // Auth başarılı — role AuthContext'te onAuthStateChanged ile set edilecek
      navigate('/admin');
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        // 2) Firebase Auth'ta yok — Firestore'dan kontrol et + migrate et
        try {
          const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
          if (!settingsDoc.exists()) { setError('Admin ayarları bulunamadı'); setLoading(false); return; }
          const adminData = settingsDoc.data();

          if (adminUser.trim() !== adminData.username) {
            setError('Kullanıcı adı hatalı');
            await recordAttempt('admin_' + adminUser.trim(), false);
            setLoading(false); return;
          }

          // Şifre kontrolü: hash + düz metin fallback
          const hashedPass = await hashPin(adminPass);
          if (adminData.password !== hashedPass && adminData.password !== adminPass) {
            setError('Şifre hatalı');
            await recordAttempt('admin_' + adminUser.trim(), false);
            setLoading(false); return;
          }

          // Firestore eşleşti — Firebase Auth hesabı oluştur (otomatik migration)
          try {
            await createUserWithEmailAndPassword(auth, email, adminPass);
            // Firestore'da admin email'i kaydet
            await updateDoc(doc(db, 'settings', 'admin'), { authEmail: email, password: hashedPass });
          } catch (createErr) {
            // auth/email-already-in-use olabilir — şifre yanlıştı demek
            if (createErr.code === 'auth/email-already-in-use') {
              setError('Şifre hatalı');
              await recordAttempt('admin_' + adminUser.trim(), false);
              setLoading(false); return;
            }
            // Diğer hatalar — migration başarısız ama Firestore ile devam et
            console.warn('Auth migration failed:', createErr.code);
          }

          await recordAttempt('admin_' + adminUser.trim(), true);
          await loginAsAdmin({ ...adminData, role: 'admin' });
          navigate('/admin');
        } catch (fsErr) { setError('Giriş sırasında hata oluştu'); }
      } else {
        setError(authErr.code === 'auth/too-many-requests' ? 'Çok fazla deneme. Biraz bekleyin.' : 'Şifre hatalı');
        await recordAttempt('admin_' + adminUser.trim(), false);
      }
    }
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
        <img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 42 }} />
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
