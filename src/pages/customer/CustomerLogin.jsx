import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../config/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { COLORS, FONTS } from '../../config/constants.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const inputStyle = { width: '100%', padding: '14px', borderRadius: 12, border: `1.5px solid ${COLORS.divider}`, fontSize: 15, fontWeight: 600, boxSizing: 'border-box', outline: 'none', letterSpacing: 0, background: COLORS.warmGray, color: COLORS.fioreBeyaz };

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState(location.state?.mode || 'login'); // login | register | forgot
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [refInput, setRefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Telefon → Firestore'dan email bul
  const findEmailByPhone = async (phoneNum) => {
    const clean = phoneNum.replace(/\D/g, '');
    const formatted = '+90' + (clean.startsWith('0') ? clean.slice(1) : clean);
    const q = query(collection(db, 'customers'), where('phone', '==', formatted));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data().email;
  };

  // Giriş yap
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);

  const handleLogin = async () => {
    // Kilit kontrolü
    if (lockUntil > Date.now()) {
      const mins = Math.ceil((lockUntil - Date.now()) / 60000);
      setError(`Çok fazla yanlış deneme. ${mins} dakika bekleyin.`);
      return;
    }
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) { setError('Telefon numarası 10 haneli olmalıdır'); return; }
    if (password.length < 4) { setError('Şifrenizi girin'); return; }
    setLoading(true); setError('');
    let customerEmail = null;
    try {
      customerEmail = await findEmailByPhone(phone);
      if (!customerEmail) { setError('Bu numarayla hesap bulunamadı. Kayıt olun.'); setLoading(false); return; }
      await signInWithEmailAndPassword(auth, customerEmail, password);
      setLoginAttempts(0); // Başarılı — sayacı sıfırla
      const sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
      await updateDoc(doc(db, 'customers', auth.currentUser.uid), { sessionId: sid });
      sessionStorage.setItem('cdf_session', sid);
      await refreshUser();
      navigate('/musteri');
    } catch (err) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockTime = Date.now() + 15 * 60 * 1000;
        setLockUntil(lockTime);
        setError('5 yanlış deneme. 15 dakika boyunca giriş yapılamaz.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(`Şifre hatalı. (${5 - newAttempts} deneme hakkınız kaldı)`);
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla deneme. Biraz bekleyin.');
      } else {
        setError('Giriş hatası. Bilgilerinizi kontrol edin.');
      }
    }
    setLoading(false);
  };

  // Kayıt ol
  const handleRegister = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) { setError('Telefon numarası 10 haneli olmalıdır'); return; }
    if (!name.trim() || name.trim().length < 3) { setError('Adınızı ve soyadınızı girin'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Geçerli bir e-posta adresi girin'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
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

      const sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
      await setDoc(doc(db, 'customers', uid), {
        name: name.trim(),
        phone: phoneFormatted,
        email: email.trim().toLowerCase(),
        birthDate: birth || null,
        level: 'misafir',
        currentCard: 0,
        totalStamps: 0,
        goatMonthlyUsed: false,
        referralCode: refCode,
        referredBy: referredByUid,
        referralCount: 0,
        qrSecret: Math.random().toString(36).slice(2, 15),
        sessionId: sid,
        createdAt: serverTimestamp(),
      });
      sessionStorage.setItem('cdf_session', sid);

      await refreshUser();
      navigate('/musteri');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kayıtlı.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf. En az 6 karakter girin.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta adresi.');
      } else {
        setError(`Kayıt hatası: ${err.message}`);
      }
    }
    setLoading(false);
  };

  // Şifremi unuttum
  const handleForgot = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { setError('Telefon numaranızı girin'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const customerEmail = await findEmailByPhone(phone);
      if (!customerEmail) { setError('Bu numarayla hesap bulunamadı.'); setLoading(false); return; }
      await sendPasswordResetEmail(auth, customerEmail);
      setSuccess(`Şifre sıfırlama bağlantısı ${customerEmail.replace(/(.{3})(.*)(@.*)/, '$1***$3')} adresine gönderildi! İstenmeyen (spam) kutunuzu kontrol etmeyi unutmayın.`);
    } catch (err) {
      setError('Şifre sıfırlama gönderilemedi. Tekrar deneyin.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: FONTS.body }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px 10px' }}>
        <img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 45 }} />
      </div>
      <div style={{ textAlign: 'center', color: COLORS.fioreOrange, fontFamily: FONTS.script, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Sei Perfetto</div>

      <div style={{ background: COLORS.cardBg, borderRadius: '28px 28px 0 0', minHeight: 'calc(100vh - 130px)', padding: '28px 24px' }}>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.fioreBeyaz, color: COLORS.fioreBeyaz, marginBottom: 4 }}>
          {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Şifremi Unuttum'}
        </div>
        <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 24, lineHeight: 1.5 }}>
          {mode === 'login' ? 'Telefon numaran ve şifrenle giriş yap' : mode === 'register' ? 'Yeni hesap oluştur, damga toplamaya başla!' : 'Telefon numaranı gir, e-postana şifre sıfırlama linki gönderelim'}
        </div>

        {/* Telefon — hep göster */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Telefon Numarası</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ padding: '14px 12px', background: COLORS.warmGray, borderRadius: 12, fontWeight: 700, fontSize: 14, color: COLORS.grayDark }}>+90</div>
            <input type="tel" placeholder="5XX XXX XX XX" value={phone} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setPhone(v); }} style={{ ...inputStyle, textAlign: 'center', letterSpacing: 1 }} maxLength={10} inputMode="numeric" />
          </div>
        </div>

        {/* İsim — kayıt */}
        {mode === 'register' && <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Ad Soyad</div>
          <input placeholder="Adınız Soyadınız" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>}

        {/* Email — kayıt */}
        {mode === 'register' && <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>E-posta Adresi</div>
          <input type="email" placeholder="ornek@gmail.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </div>}

        {/* Şifre — login ve register */}
        {mode !== 'forgot' && <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Şifre</div>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} placeholder={mode === 'register' ? 'En az 6 karakter' : 'Şifreniz'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 44 }} />
            <span onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {showPass
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B8E84" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B8E84" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </span>
          </div>
        </div>}

        {/* Doğum + referans — kayıt */}
        {mode === 'register' && <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Doğum Tarihi <span style={{ color: COLORS.gray, fontWeight: 400 }}>(opsiyonel)</span></div>
            <input type="date" value={birth} onChange={e => setBirth(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>Davet Kodu <span style={{ color: COLORS.gray, fontWeight: 400 }}>(opsiyonel)</span></div>
            <input placeholder="Arkadaşınızın kodu" value={refInput} onChange={e => setRefInput(e.target.value.toUpperCase())} style={{ ...inputStyle, letterSpacing: 2, textAlign: 'center' }} maxLength={10} />
          </div>
        </>}

        {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}
        {success && <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: `1px solid ${COLORS.green}` }}><div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>{success}</div></div>}

        {/* Ana buton */}
        <div
          onClick={loading ? undefined : (mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot)}
          style={{ background: loading ? COLORS.grayLight : COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 50, padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer', width: '100%' }}
        >
          {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Şifre Sıfırla'}
        </div>

        {/* Alt linkler */}
        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'login' && <>
            <span onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} style={{ fontSize: 13, color: COLORS.blue, fontWeight: 600, cursor: 'pointer' }}>Şifremi Unuttum</span>
            <span style={{ fontSize: 13, color: COLORS.grayDark }}>Hesabın yok mu? <span onClick={() => { setMode('register'); setError(''); }} style={{ color: COLORS.fioreOrange, fontWeight: 700, cursor: 'pointer' }}>Kayıt Ol</span></span>
          </>}
          {mode === 'register' && <span style={{ fontSize: 13, color: COLORS.grayDark }}>Hesabın var mı? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: COLORS.fioreOrange, fontWeight: 700, cursor: 'pointer' }}>Giriş Yap</span></span>}
          {mode === 'forgot' && <span onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ fontSize: 13, color: COLORS.fioreOrange, fontWeight: 700, cursor: 'pointer' }}>← Giriş Yap'a Dön</span>}
        </div>

        <div onClick={() => navigate('/')} style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: COLORS.gray, cursor: 'pointer' }}>← Ana Sayfa</div>

        <div style={{ marginTop: 32, padding: '18px 16px', background: COLORS.warmGray, borderRadius: 22, border: `1px solid ${COLORS.divider}` }}>
          {[
            [COLORS.fioreOrange, '7 kahvede 1 ücretsiz'],
            [COLORS.gold, 'GOAT üyelere özel ayrıcalıklar'],
            [COLORS.green, 'Kampanya ve sürpriz fırsatlar'],
          ].map(([c, t], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: i > 0 ? '10px 0 0' : '0', borderTop: i > 0 ? `1px solid ${COLORS.divider}` : 'none', paddingTop: i > 0 ? 10 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: COLORS.fioreBeyaz, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
