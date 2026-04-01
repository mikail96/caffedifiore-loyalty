import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { COLORS, FONTS, STAMP_CATEGORIES, STAMP_CONFIG } from '../../config/constants.js';
import { calculateDistance } from '../../utils/helpers.js';

const f = FONTS;
const Card = ({ children, style = {}, border }) => <div style={{ background: COLORS.cardBg, borderRadius: 22, padding: 18, border: `1px solid ${COLORS.divider}`, border: border || 'none', fontFamily: f.body, ...style }}>{children}</div>;
const Btn = ({ children, color = COLORS.fioreOrange, disabled = false, onClick }) => <div onClick={disabled ? undefined : onClick} style={{ background: disabled ? COLORS.grayLight : color, color: disabled ? COLORS.gray : COLORS.fioreBeyaz, borderRadius: 50, padding: '14px', textAlign: 'center', fontWeight: 700, fontSize: 14, width: '100%', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, fontFamily: f.body, letterSpacing: 0.3 }}>{children}</div>;
const Badge = ({ text, color = COLORS.fioreOrange }) => <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.fioreBeyaz, background: color, padding: '4px 12px', borderRadius: 20, fontFamily: f.body }}>{text}</span>;
const LvBadge = ({ level }) => { const c = { misafir: ['Fiore Misafir', COLORS.fioreOrange, COLORS.orangeGlow], mudavim: ['Fiore Müdavim', COLORS.fioreOrange, COLORS.orangeGlow], goat: ['Fiore GOAT', COLORS.gold, COLORS.goldBg] }[level]; return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c[2], padding: '6px 14px', borderRadius: 24, fontSize: 12, color: c[1], fontWeight: 700, border: `1.5px solid ${c[1]}20`, fontFamily: f.body }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: c[1] }} />{c[0]}</div>; };
const Stamps = ({ count }) => <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < count ? COLORS.fioreOrange : 'transparent', border: i < count ? 'none' : `1.5px solid ${COLORS.grayLight}` }}>{i < count ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17L4 12"/></svg> : <span style={{ color: COLORS.gray, fontSize: 10, fontWeight: 600 }}>{i + 1}</span>}</div>)}<div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: count >= 7 ? COLORS.green : 'transparent', border: count >= 7 ? 'none' : `1.5px dashed ${COLORS.green}60` }}>{count >= 7 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17L4 12"/></svg> : <span style={{ color: COLORS.green, fontSize: 9, fontWeight: 800 }}>FREE</span>}</div></div>;

export default function StaffPanel() {
  const { userData, logout } = useAuth();
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState(null);
  const [cat, setCat] = useState(null);
  const [gps, setGps] = useState(false);
  const [gpsDistance, setGpsDistance] = useState(null);
  const [gpsChecking, setGpsChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [tt, setTt] = useState('success');
  const [logs, setLogs] = useState([]);
  const [tStamp, setTStamp] = useState(0);
  const [tFree, setTFree] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);
  const branchName = userData?.branch === 'gokkusagi' ? 'Gökkuşağı AVM' : 'Forum Kampüs AVM';
  const msg = (m, t = 'success') => { setToast(m); setTt(t); setTimeout(() => setToast(null), 2500); };

  // Kampanyaları yükle
  useEffect(() => {
    getDocs(query(collection(db, 'campaigns'), where('active', '==', true)))
      .then(snap => setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, []);

  // GPS kontrolü
  const checkGPS = async () => {
    setGpsChecking(true);
    try {
      const branchDoc = await getDoc(doc(db, 'branches', userData?.branch));
      const branchData = branchDoc.data();
      if (!branchData?.lat || !branchData?.lng) {
        setGps(true);
        setGpsDistance(null);
        setGpsChecking(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, branchData.lat, branchData.lng);
          const distM = Math.round(dist);
          setGpsDistance(distM);
          setGps(distM <= STAMP_CONFIG.gpsRadiusMeters);
          setGpsChecking(false);
        },
        () => { setGps(false); setGpsDistance(null); setGpsChecking(false); msg('Konum alınamadı!', 'error'); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (e) { setGps(true); setGpsChecking(false); }
  };
  useEffect(() => { checkGPS(); }, []);

  // QR Tarama başlat
  const startScan = async () => {
    setScanError('');
    setScanning(true);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // QR okundu — kamerayı durdur
          await scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          await handleQRResult(decodedText);
        },
        () => {} // hata callback (her frame için)
      );
    } catch (err) {
      setScanning(false);
      setScanError('Kamera açılamadı. Kamera izni verin veya başka uygulama kamerayı kullanıyor olabilir.');
    }
  };

  // QR durdur
  const stopScan = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // QR sonucu işle
  const handleQRResult = async (qrData) => {
    // Format: CDF:phone:timestamp:hash
    if (!qrData.startsWith('CDF:')) {
      msg('Geçersiz QR kod! CaffeDiFiore QR\'ı okutun.', 'error');
      return;
    }
    const parts = qrData.split(':');
    if (parts.length < 4) {
      msg('Geçersiz QR format!', 'error');
      return;
    }
    const phone = parts[1];

    // Müşteriyi telefon numarasıyla bul
    const custQuery = query(collection(db, 'customers'), where('phone', '==', phone));
    const custSnap = await getDocs(custQuery);
    if (custSnap.empty) {
      msg('Müşteri bulunamadı! Kayıtlı değil.', 'error');
      return;
    }
    const custDoc = custSnap.docs[0];
    setSel({ id: custDoc.id, ...custDoc.data() });
    setStep(null);
    setCat(null);
    msg(custDoc.data().name + ' bulundu!');
  };

  // Damga ekle
  const doStamp = async () => {
    if (!sel || !gps || (sel.currentCard || 0) >= 7 || busy) return;
    setBusy(true);
    try {
      const recentQuery = query(collection(db, 'stampLogs'), where('customerId', '==', sel.id), where('type', '==', 'stamp'));
      const recentSnap = await getDocs(recentQuery);
      if (!recentSnap.empty) {
        let lastTime = 0;
        recentSnap.docs.forEach(d => { const t = d.data().timestamp?.toDate?.()?.getTime() || 0; if (t > lastTime) lastTime = t; });
        if (lastTime > 0) {
          const diffMin = (Date.now() - lastTime) / 60000;
          if (diffMin < STAMP_CONFIG.minStampIntervalMinutes) {
            msg(`⏱ Son damgadan ${Math.ceil(STAMP_CONFIG.minStampIntervalMinutes - diffMin)} dk beklenmeli!`, 'error');
            setBusy(false); return;
          }
        }
      }
      const nc = (sel.currentCard || 0) + 1, nt = (sel.totalStamps || 0) + 1;
      let nl = sel.level;
      if (nt >= 40 && sel.level !== 'goat') nl = 'goat';
      else if (nt >= 16 && sel.level === 'misafir') nl = 'mudavim';
      await updateDoc(doc(db, 'customers', sel.id), { currentCard: nc, totalStamps: nt, level: nl });
      await addDoc(collection(db, 'stampLogs'), { customerId: sel.id, customerName: sel.name, staffId: userData.id, staffName: userData.name, branchId: userData.branch, type: 'stamp', productCategory: cat, cardBefore: sel.currentCard || 0, cardAfter: nc, timestamp: serverTimestamp() });

      // Referans bonus: İlk damgada referans sahibine +1 damga
      if (nt === 1 && sel.referredBy) {
        try {
          const refDoc = await getDoc(doc(db, 'customers', sel.referredBy));
          if (refDoc.exists()) {
            const rd = refDoc.data();
            const rnc = (rd.currentCard || 0) + 1 > 7 ? rd.currentCard || 0 : (rd.currentCard || 0) + 1;
            const rnt = (rd.totalStamps || 0) + 1;
            let rnl = rd.level;
            if (rnt >= 40 && rd.level !== 'goat') rnl = 'goat';
            else if (rnt >= 16 && rd.level === 'misafir') rnl = 'mudavim';
            await updateDoc(doc(db, 'customers', sel.referredBy), { currentCard: rnc, totalStamps: rnt, level: rnl });
            await addDoc(collection(db, 'stampLogs'), { customerId: sel.referredBy, customerName: rd.name, staffId: 'system', staffName: 'Referans Bonus', branchId: userData.branch, type: 'referral_bonus', cardAfter: rnc, timestamp: serverTimestamp() });
          }
        } catch (e) { console.error('Referans bonus hatası:', e); }
      }

      const updated = { ...sel, currentCard: nc, totalStamps: nt, level: nl };
      setSel(updated);
      setTStamp(p => p + 1);
      setLogs(p => [{ cn: sel.name, type: 'stamp', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), cat }, ...p]);
      msg(`Damga: ${sel.name} ${nc}/7`);
      if (nl !== sel.level) setTimeout(() => msg(`🎉 ${sel.name} ${nl.toUpperCase()} oldu!`, 'warning'), 1500);
      setStep(null); setCat(null);
    } catch (e) { msg('Hata!', 'error'); }
    setBusy(false);
  };

  const doFree = async () => {
    if (!sel || (sel.currentCard || 0) < 7 || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'customers', sel.id), { currentCard: 0 });
      await addDoc(collection(db, 'stampLogs'), { customerId: sel.id, customerName: sel.name, staffId: userData.id, staffName: userData.name, branchId: userData.branch, type: 'free_redeemed', timestamp: serverTimestamp() });
      setSel({ ...sel, currentCard: 0 }); setTFree(p => p + 1);
      setLogs(p => [{ cn: sel.name, type: 'free', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
      msg('Ücretsiz verildi! Kart 0/7');
    } catch (e) { msg('Hata!', 'error'); }
    setBusy(false);
  };

  const doGoat = async () => {
    if (!sel || sel.level !== 'goat' || sel.goatMonthlyUsed || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'customers', sel.id), { goatMonthlyUsed: true });
      await addDoc(collection(db, 'stampLogs'), { customerId: sel.id, customerName: sel.name, staffId: userData.id, staffName: userData.name, branchId: userData.branch, type: 'goat_monthly', timestamp: serverTimestamp() });
      setSel({ ...sel, goatMonthlyUsed: true });
      setLogs(p => [{ cn: sel.name, type: 'goat', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
      msg('GOAT aylık ücretsiz verildi!');
    } catch (e) { msg('Hata!', 'error'); }
    setBusy(false);
  };

  // Cleanup scanner on unmount
  useEffect(() => { return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); }; }, []);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      {toast && <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: tt === 'success' ? COLORS.green : tt === 'error' ? COLORS.red : COLORS.gold, color: COLORS.fioreBeyaz, padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 340, textAlign: 'center' }}>{toast}</div>}

      {/* Header */}
      <div style={{ background: 'linear-gradient(170deg, #3D2B1F, #261810)', padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><img src="/icons/logo-header.png" alt="" style={{ height: 24, opacity: 0.95 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 3 }}>PERSONEL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.fioreBeyaz, marginTop: 4 }}>{userData?.name}</div>
            <div style={{ fontSize: 12, color: COLORS.fioreOrange, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>{branchName}</div>
          </div>
          <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: COLORS.fioreOrange, cursor: 'pointer', background: COLORS.orangeGlow, padding: '6px 14px', borderRadius: 50, fontWeight: 600, border: '1px solid rgba(236,103,26,0.15)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Çıkış</div>
        </div>
      </div>

      {/* İstatistik */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 20px' }}>
        {[[tStamp, 'Damga', COLORS.fioreOrange], [tFree, 'Ücretsiz', COLORS.green]].map(([v, l, c]) => <div key={l} style={{ flex: 1, background: COLORS.cardBg, borderRadius: 22, padding: '16px', textAlign: 'center', border: `1px solid ${COLORS.divider}` }}><div style={{ fontSize: 26, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: COLORS.gray, fontWeight: 500, marginTop: 4 }}>{l}</div></div>)}
      </div>

      {/* GPS */}
      <div style={{ padding: '0 20px 10px' }}>
        <div onClick={checkGPS} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: gpsChecking ? COLORS.warmGray : gps ? COLORS.greenBg : 'rgba(217,68,68,0.04)', border: `1.5px solid ${gpsChecking ? COLORS.grayLight : gps ? COLORS.green : COLORS.red}20`, cursor: 'pointer' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: gpsChecking ? COLORS.gray : gps ? COLORS.green : COLORS.red }} />
          <div><div style={{ fontSize: 12, fontWeight: 600, color: gpsChecking ? COLORS.gray : gps ? COLORS.green : COLORS.red }}>{gpsChecking ? 'Konum kontrol ediliyor...' : gps ? 'Şube alanında' : 'Şube dışında!'}</div><div style={{ fontSize: 10, color: COLORS.grayDark }}>{gpsChecking ? '' : gpsDistance !== null ? `${branchName} · ${gpsDistance}m` : gps ? `${branchName} · Koordinat henüz kaydedilmemiş` : 'İşlem yapılamaz'}</div></div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.blue, fontWeight: 700 }}>Yenile</span>
        </div>
      </div>

      {/* Aktif Kampanyalar */}
      {campaigns.length > 0 && <div style={{ padding: '0 16px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.grayDark, marginBottom: 6 }}>Aktif Kampanyalar</div>
        {campaigns.map(c => (
          <div key={c.id} style={{ background: COLORS.orangeGlow, borderRadius: 10, padding: '10px 14px', marginBottom: 4, border: `1.5px solid ${COLORS.fioreOrange}30` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreOrange }}>{c.title}</div>
            {c.description && <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 2 }}>{c.description}</div>}
          </div>
        ))}
      </div>}

      {/* QR TARAMA — müşteri seçilmemişse */}
      {!sel && (
        <div style={{ padding: '0 16px 16px' }}>
          <Card>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12, textAlign: 'center' }}>Müşteri QR Kodunu Okut</div>

            {/* Kamera görüntüsü */}
            <div id="qr-reader" style={{
              width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 12,
              display: scanning ? 'block' : 'none',
              border: `3px solid ${COLORS.fioreOrange}`,
            }} />

            {!scanning ? (
              <Btn onClick={startScan} disabled={!gps}>
                Kamerayı Aç
              </Btn>
            ) : (
              <Btn onClick={stopScan} color={COLORS.red}>
                ✕ Kamerayı Kapat
              </Btn>
            )}

            {scanError && (
              <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 14px', marginTop: 10, border: `1.5px solid ${COLORS.red}` }}>
                <div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{scanError}</div>
              </div>
            )}

            {!gps && !gpsChecking && (
              <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 14px', marginTop: 10, border: `1.5px solid ${COLORS.red}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.red }}>Şube alanında değilsiniz.</div>
              </div>
            )}

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.grayDark, lineHeight: 1.6 }}>
                Müşteriden telefonundaki QR kodunu göstermesini isteyin.
                <br />Kamerayı QR koda tutun — otomatik okunacak.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Müşteri Bulundu */}
      {sel && <div style={{ padding: '0 16px 16px' }}>
        <Card border={`2px solid ${sel.level === 'goat' ? COLORS.gold : COLORS.green}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 700, color: COLORS.green }}>Müşteri Bulundu</span>{sel.level === 'goat' && <Badge text="GOAT" color={COLORS.gold} />}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 6 }}>{sel.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><LvBadge level={sel.level} /><span style={{ fontSize: 12, color: COLORS.grayDark, fontWeight: 600 }}>· {sel.currentCard || 0}/7</span></div>
          <Stamps count={sel.currentCard || 0} />

          {sel.level === 'goat' && <div style={{ background: COLORS.goldBg, borderRadius: 12, padding: '12px', marginTop: 12, border: `1.5px solid ${COLORS.gold}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.gold, marginBottom: 6 }}>GOAT Durum</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: COLORS.grayDark }}>Aylık ücretsiz:</span><span style={{ color: sel.goatMonthlyUsed ? COLORS.gray : COLORS.green, fontWeight: 700 }}>{sel.goatMonthlyUsed ? '✗ Kullanıldı' : '✓ Kullanılmadı'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}><span style={{ color: COLORS.grayDark }}>%10 indirim:</span><span style={{ color: COLORS.gold, fontWeight: 700 }}>Aktif</span></div>
          </div>}

          {!step && <><div style={{ marginTop: 14, fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>İşlem Seç:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn onClick={() => { if ((sel.currentCard || 0) >= 7) { msg('Kart dolu!', 'error'); return; } setStep('cat'); }} disabled={!gps || (sel.currentCard || 0) >= 7}>{'Damga Ekle' + (sel.level === 'goat' ? ' (%10 indirimli)' : '')}</Btn>
            {sel.level === 'goat' && <Btn onClick={doGoat} disabled={!gps || sel.goatMonthlyUsed} color={COLORS.gold}>GOAT Aylık Ücretsiz</Btn>}
            <Btn onClick={doFree} disabled={!gps || (sel.currentCard || 0) < 7} color={COLORS.green}>Sadakat Ücretsiz</Btn>
          </div></>}

          {step === 'cat' && <><div style={{ marginTop: 14, fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>Müşteri ne aldı?</div>
            {STAMP_CATEGORIES.map(x => <div key={x.id} onClick={() => { if (!x.eligible) { msg(x.name + ' damga kazandırmaz!', 'error'); return; } setCat(x.id); setStep('ok'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, marginBottom: 5, cursor: 'pointer', background: x.eligible ? COLORS.fioreBeyaz : COLORS.warmGray, border: `1.5px solid ${x.eligible ? COLORS.green : COLORS.grayLight}`, opacity: x.eligible ? 1 : 0.5 }}><span style={{ fontSize: 18 }}>{x.icon}</span><div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: x.eligible ? COLORS.fioreSiyah : COLORS.gray }}>{x.name}</div><span style={{ fontSize: 14, color: x.eligible ? COLORS.green : COLORS.red, fontWeight: 800 }}>{x.eligible ? '✓' : '✗'}</span></div>)}
            <div onClick={() => setStep(null)} style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>← Geri</div>
          </>}

          {step === 'ok' && <div style={{ marginTop: 14, background: COLORS.orangeGlow, borderRadius: 14, padding: 16, border: `2px solid ${COLORS.fioreOrange}`, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 8 }}>Damga Onayı</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz }}>{sel.name}</div>
            <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 6 }}>{STAMP_CATEGORIES.find(c => c.id === cat)?.icon} {STAMP_CATEGORIES.find(c => c.id === cat)?.name}</div>
            <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 4 }}>Kart: {sel.currentCard || 0}/7 → {(sel.currentCard || 0) + 1}/7</div>
            {sel.level === 'goat' && <div style={{ marginTop: 6 }}><Badge text="💰 %10 indirim uygula" color={COLORS.gold} /></div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><div style={{ flex: 1 }}><Btn onClick={doStamp} color={COLORS.green}>✓ Onayla</Btn></div><div style={{ flex: 1 }}><Btn onClick={() => { setStep('cat'); setCat(null); }} color={COLORS.gray}>← Geri</Btn></div></div>
          </div>}

          {!gps && <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 14px', marginTop: 10, border: `1.5px solid ${COLORS.red}` }}><div style={{ fontSize: 12, fontWeight: 700, color: COLORS.red }}>Şube dışındasınız</div></div>}
          <div onClick={() => { setSel(null); setStep(null); setCat(null); }} style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>Yeni QR Okut</div>
        </Card>
      </div>}

      {/* Son İşlemler */}
      {logs.length > 0 && <div style={{ padding: '0 16px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 8 }}>Son İşlemler</div>
        {logs.slice(0, 5).map((l, i) => <div key={i} style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span style={{ fontSize: 13, fontWeight: 700 }}>{l.cn}</span><span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8 }}>{l.time}</span></div><Badge text={l.type === 'stamp' ? 'DAMGA' : l.type === 'goat' ? 'GOAT' : 'ÜCRETSİZ'} color={l.type === 'stamp' ? COLORS.fioreOrange : l.type === 'goat' ? COLORS.gold : COLORS.green} /></div>)}
      </div>}
    </div>
  );
}
