import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { COLORS } from '../../config/constants.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

// Telefon numarasını email formatına çevir
const phoneToEmail = (phone) => {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('0') ? clean.slice(1) : clean;
  return `${num}@caffedifiore.app`;
};

const inputStyle = { width: '100%', padding: '14px', borderRadius: 12, border: `2px solid ${COLORS.grayLight}`, fontSize: 15, fontWeight: 600, boxSizing: 'border-box', outline: 'none', textAlign: 'center', letterSpacing: 1 };

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [refInput, setRefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Giriş yap
  const handleLogin = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { setError('Geçerli bir telefon numarası girin'); return; }
    if (password.length < 4) { setError('Şifrenizi girin (en az 4 karakter)'); return; }
    setLoading(true); setError('');
    try {
      const email = phoneToEmail(phone);
      await signInWithEmailAndPassword(auth, email, password);
      await refreshUser();
      navigate('/musteri');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Bu numarayla hesap bulunamadı veya şifre yanlış.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Şifre yanlış. Tekrar deneyin.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla deneme. Biraz bekleyin.');
      } else {
        setError(`Giriş hatası: ${err.message}`);
      }
    }
    setLoading(false);
  };

  // Kayıt ol
  const handleRegister = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { setError('Geçerli bir telefon numarası girin'); return; }
    if (!name.trim() || name.trim().length < 3) { setError('Adınızı ve soyadınızı girin'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true); setError('');
    try {
      const email = phoneToEmail(phone);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const phoneFormatted = '+90' + (clean.startsWith('0') ? clean.slice(1) : clean);

      // Referans kodu oluştur
      const refCode = name.trim().toUpperCase().replace(/\s/g, '').slice(0, 5) +
        Math.random().toString(36).slice(2, 6).toUpperCase();

      // Davet kodu kontrolü
      let referredByUid = null;
      if (refInput.trim()) {
        const refQuery = query(collection(db, 'customers'), where('referralCode', '==', refInput.trim().toUpperCase()));
        const refSnap = await getDocs(refQuery);
        if (!refSnap.empty) {
          referredByUid = refSnap.docs[0].id;
          await updateDoc(doc(db, 'customers', referredByUid), { referralCount: increment(1) });
        }
      }

      // Müşteri dökümanı oluştur
      await setDoc(doc(db, 'customers', uid), {
        name: name.trim(),
        phone: phoneFormatted,
        birthDate: birth || null,
        level: 'misafir',
        currentCard: 0,
        totalStamps: 0,
        goatMonthlyUsed: false,
        referralCode: refCode,
        referredBy: referredByUid,
        referralCount: 0,
        qrSecret: Math.random().toString(36).slice(2, 15),
        createdAt: serverTimestamp(),
      });

      await refreshUser();
      navigate('/musteri');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu telefon numarası zaten kayıtlı. Giriş yapın.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf. En az 6 karakter girin.');
      } else {
        setError(`Kayıt hatası: ${err.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.fioreSiyah }}>
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px 10px' }}>
        <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 40 }} />
      </div>
      <div style={{ textAlign: 'center', color: COLORS.fioreOrange, fontStyle: 'italic', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>Sei Perfetto</div>

      <div style={{ background: COLORS.fioreBeyaz, borderRadius: '28px 28px 0 0', minHeight: 'calc(100vh - 130px)', padding: '28px 24px' }}>
        {/* Başlık */}
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.fioreSiyah, marginBottom: 4 }}>
          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </div>
        <div style={{ fontSize: 13, color: COLORS.grayDark, marginBottom: 24, lineHeight: 1.5 }}>
          {mode === 'login' ? 'Telefon numaran ve şifrenle giriş yap' : 'Yeni hesap oluştur, damga toplamaya başla!'}
        </div>

        {/* Telefon */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.fioreSiyah }}>Telefon Numarası</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ padding: '14px 12px', background: COLORS.warmGray, borderRadius: 12, fontWeight: 700, fontSize: 14, color: COLORS.grayDark }}>+90</div>
            <input type="tel" placeholder="5XX XXX XX XX" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} maxLength={11} />
          </div>
        </div>

        {/* İsim — sadece kayıt */}
        {mode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.fioreSiyah }}>Ad Soyad</div>
            <input placeholder="Adınız Soyadınız" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, textAlign: 'left', letterSpacing: 0 }} />
          </div>
        )}

        {/* Şifre */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.fioreSiyah }}>Şifre</div>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} placeholder={mode === 'register' ? 'En az 6 karakter' : 'Şifreniz'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, textAlign: 'left', letterSpacing: 0, paddingRight: 44 }} />
            <span onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</span>
          </div>
        </div>

        {/* Doğum tarihi + referans — sadece kayıt */}
        {mode === 'register' && <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.fioreSiyah }}>Doğum Tarihi <span style={{ color: COLORS.gray, fontWeight: 400 }}>(opsiyonel)</span></div>
            <input type="date" value={birth} onChange={e => setBirth(e.target.value)} style={{ ...inputStyle, textAlign: 'left', letterSpacing: 0 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.fioreSiyah }}>Davet Kodu <span style={{ color: COLORS.gray, fontWeight: 400 }}>(opsiyonel)</span></div>
            <input placeholder="Arkadaşınızın kodu" value={refInput} onChange={e => setRefInput(e.target.value.toUpperCase())} style={{ ...inputStyle, letterSpacing: 2 }} maxLength={10} />
          </div>
        </>}

        {/* Hata */}
        {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

        {/* Buton */}
        <div
          onClick={loading ? undefined : (mode === 'login' ? handleLogin : handleRegister)}
          style={{ background: loading ? COLORS.grayLight : COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer', width: '100%' }}
        >
          {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </div>

        {/* Mod değiştir */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {mode === 'login' ? (
            <span style={{ fontSize: 13, color: COLORS.grayDark }}>Hesabın yok mu? <span onClick={() => { setMode('register'); setError(''); }} style={{ color: COLORS.fioreOrange, fontWeight: 700, cursor: 'pointer' }}>Kayıt Ol</span></span>
          ) : (
            <span style={{ fontSize: 13, color: COLORS.grayDark }}>Hesabın var mı? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: COLORS.fioreOrange, fontWeight: 700, cursor: 'pointer' }}>Giriş Yap</span></span>
          )}
        </div>

        <div onClick={() => navigate('/')} style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: COLORS.gray, cursor: 'pointer' }}>← Geri</div>

        {/* Alt bilgi */}
        <div style={{ marginTop: 32, padding: '16px', background: COLORS.cream, borderRadius: 14 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {[['🐐', '7\'de 1', 'Ücretsiz'], ['🏆', 'GOAT', 'Ayrıcalık'], ['🎁', 'Özel', 'Kampanya']].map(([ic, t1, t2]) => (
              <div key={t1} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{ic}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.fioreSiyah, marginTop: 4 }}>{t1}</div>
                <div style={{ fontSize: 10, color: COLORS.grayDark }}>{t2}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
