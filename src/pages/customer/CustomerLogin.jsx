import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase.js';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { COLORS } from '../../config/constants.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState('phone'); // phone | otp | register
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [refInput, setRefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const otpRefs = useRef([]);
  const recaptchaRef = useRef(null);

  // Telefon numarasını +90 formatına çevir
  const formatPhoneForFirebase = (p) => {
    const clean = p.replace(/\D/g, '');
    if (clean.startsWith('90') && clean.length === 12) return '+' + clean;
    if (clean.startsWith('0') && clean.length === 11) return '+9' + clean;
    if (clean.length === 10) return '+90' + clean;
    return '+90' + clean;
  };

  // SMS gönder
  const handleSendOTP = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Geçerli bir telefon numarası girin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Her seferinde temiz reCAPTCHA oluştur
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch(e) {}
      }
      const container = document.getElementById('recaptcha-box');
      if (container) container.innerHTML = '';

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-box', { size: 'invisible' });
      recaptchaRef.current = verifier;

      const formatted = formatPhoneForFirebase(phone);
      const result = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmResult(result);
      setStep('otp');
    } catch (err) {
      console.error('SMS error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla deneme. Lütfen biraz bekleyin.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Geçersiz telefon numarası. Başında 5 ile başlayan 10 haneli numara girin.');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS kotası doldu. Lütfen daha sonra tekrar deneyin.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.');
      } else {
        setError(`Hata: ${err.code || 'bilinmiyor'} — ${err.message || 'SMS gönderilemedi'}`);
      }
    }
    setLoading(false);
  };

  // OTP doğrula
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('6 haneli kodu girin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await confirmResult.confirm(code);
      const uid = result.user.uid;

      // Müşteri var mı kontrol et
      const customerDoc = await getDoc(doc(db, 'customers', uid));
      if (customerDoc.exists()) {
        // Mevcut müşteri — ana sayfaya yönlendir
        await refreshUser();
        navigate('/musteri');
      } else {
        // Yeni müşteri — kayıt ekranı
        setStep('register');
      }
    } catch (err) {
      console.error('OTP error:', err);
      setError('Kod hatalı. Tekrar deneyin.');
    }
    setLoading(false);
  };

  // Yeni müşteri kayıt
  const handleRegister = async () => {
    if (!name.trim() || name.trim().length < 3) {
      setError('Adınızı ve soyadınızı girin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const uid = auth.currentUser.uid;
      const phoneNumber = auth.currentUser.phoneNumber;

      // Referans kodu oluştur (ismin ilk 5 harfi + rastgele)
      const refCode = name.trim().toUpperCase().replace(/\s/g, '').slice(0, 5) +
        Math.random().toString(36).slice(2, 6).toUpperCase();

      // Davet kodu girilmişse referans sahibini bul
      let referredByUid = null;
      if (refInput.trim()) {
        const refQuery = query(
          collection(db, 'customers'),
          where('referralCode', '==', refInput.trim().toUpperCase())
        );
        const refSnap = await getDocs(refQuery);
        if (!refSnap.empty) {
          referredByUid = refSnap.docs[0].id;
          // Referans sahibinin sayacını artır
          await updateDoc(doc(db, 'customers', referredByUid), {
            referralCount: increment(1),
          });
        }
      }

      await setDoc(doc(db, 'customers', uid), {
        name: name.trim(),
        phone: phoneNumber,
        birthDate: birth || null,
        level: 'misafir',
        totalStamps: 0,
        currentCard: 0,
        goatMonthlyUsed: false,
        goatMonthlyResetDate: null,
        referralCode: refCode,
        referredBy: referredByUid,
        referralCount: 0,
        favoriteItems: [],
        qrSecret: Math.random().toString(36).slice(2) + Date.now().toString(36),
        createdAt: serverTimestamp(),
      });

      await refreshUser();
      navigate('/musteri');
    } catch (err) {
      console.error('Register error:', err);
      setError('Kayıt sırasında hata oluştu.');
    }
    setLoading(false);
  };

  // OTP input handler
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
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

  return (
    <div style={{ minHeight: '100vh', background: COLORS.fioreSiyah, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '50px 24px 24px', textAlign: 'center' }}>
        <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 40 }} />
        <div style={{ fontSize: 13, color: COLORS.fioreOrange, fontStyle: 'italic', fontFamily: 'Georgia, serif', marginTop: 8, letterSpacing: 2 }}>Sei Perfetto</div>
      </div>

      {/* Content card */}
      <div style={{ background: COLORS.fioreBeyaz, borderRadius: '24px 24px 0 0', minHeight: 'calc(100vh - 140px)', padding: '28px 24px' }}>

        {/* STEP 1: Phone */}
        {step === 'phone' && <>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Giriş Yap / Kayıt Ol</div>
          <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 24 }}>Telefon numaranı gir — hesabın varsa giriş yapar, yoksa yeni hesap oluşturur</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Telefon Numarası</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ ...inputStyle, width: 70, textAlign: 'center', color: COLORS.gray, flexShrink: 0 }}>+90</div>
              <input
                type="tel"
                placeholder="5XX XXX XX XX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
                maxLength={15}
              />
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div id="recaptcha-box"></div>

          <div
            onClick={loading ? undefined : handleSendOTP}
            style={{ background: loading ? COLORS.grayLight : COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer', width: '100%' }}
          >
            {loading ? 'Gönderiliyor...' : 'SMS Kodu Gönder'}
          </div>

          <div onClick={() => navigate('/')} style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: COLORS.gray, cursor: 'pointer' }}>← Geri</div>

          {/* Bilgi */}
          <div style={{ marginTop: 32, padding: '16px', background: COLORS.cream, borderRadius: 14 }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {[['☕', "7'de 1\nÜcretsiz"], ['🐐', "GOAT\nAyrıcalık"], ['📢', "Özel\nKampanya"]].map(([ic, tx]) =>
                <div key={tx} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>{ic}</div>
                  <div style={{ fontSize: 10, color: COLORS.grayDark, whiteSpace: 'pre-line', lineHeight: 1.3, marginTop: 4, fontWeight: 600 }}>{tx}</div>
                </div>
              )}
            </div>
          </div>
        </>}

        {/* STEP 2: OTP */}
        {step === 'otp' && <>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Doğrulama Kodu</div>
          <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 24 }}>
            {formatPhoneForFirebase(phone)} numarasına gönderilen 6 haneli kodu girin
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {otp.map((digit, i) =>
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                type="tel"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                style={{
                  width: 44, height: 52, borderRadius: 10,
                  border: `2px solid ${digit ? COLORS.fioreOrange : COLORS.grayLight}`,
                  textAlign: 'center', fontSize: 20, fontWeight: 800,
                  background: digit ? COLORS.orangeSoft : COLORS.fioreBeyaz,
                  outline: 'none',
                }}
              />
            )}
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div
            onClick={loading ? undefined : handleVerifyOTP}
            style={{ background: loading ? COLORS.grayLight : COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Doğrulanıyor...' : '✓ Doğrula'}
          </div>

          <div onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }} style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: COLORS.gray, cursor: 'pointer' }}>← Numarayı Değiştir</div>
        </>}

        {/* STEP 3: Register */}
        {step === 'register' && <>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Hoş Geldin! 🎉</div>
          <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 24 }}>Sadakat programına katılmak için bilgilerini gir</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Ad Soyad *</div>
            <input
              placeholder="Adınız ve soyadınız"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Doğum Tarihi (isteğe bağlı)</div>
            <input
              type="date"
              value={birth}
              onChange={e => setBirth(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Davet Kodu (isteğe bağlı)</div>
            <input
              placeholder="Arkadaşından aldığın kodu gir"
              value={refInput}
              onChange={e => setRefInput(e.target.value.toUpperCase())}
              style={{ ...inputStyle, letterSpacing: 2 }}
              autoCapitalize="characters"
            />
            <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>
              Davet kodun varsa gir — arkadaşın bonus damga kazansın!
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${COLORS.red}` }}><div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{error}</div></div>}

          <div
            onClick={loading ? undefined : handleRegister}
            style={{ background: loading ? COLORS.grayLight : COLORS.fioreOrange, color: COLORS.fioreBeyaz, borderRadius: 14, padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Kaydediliyor...' : '✓ Kayıt Ol ve Başla'}
          </div>
        </>}
      </div>
    </div>
  );
}
