import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { COLORS, STAMP_CATEGORIES, STAMP_CONFIG } from '../../config/constants.js';
import { calculateDistance } from '../../utils/helpers.js';

const Card = ({ children, style = {}, border }) => <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', border: border || 'none', ...style }}>{children}</div>;
const Btn = ({ children, color = COLORS.fioreOrange, disabled = false, onClick }) => <div onClick={disabled ? undefined : onClick} style={{ background: disabled ? COLORS.grayLight : color, color: disabled ? COLORS.gray : COLORS.fioreBeyaz, borderRadius: 14, padding: '14px', textAlign: 'center', fontWeight: 800, fontSize: 14, width: '100%', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>{children}</div>;
const Badge = ({ text, color = COLORS.fioreOrange }) => <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.fioreBeyaz, background: color, padding: '3px 10px', borderRadius: 10 }}>{text}</span>;
const LvBadge = ({ level }) => { const c = { misafir: ['☕', 'Fiore Misafir', COLORS.fioreOrange, COLORS.orangeGlow], mudavim: ['⭐', 'Fiore Müdavim', COLORS.fioreOrange, COLORS.orangeGlow], goat: ['🐐', 'Fiore GOAT', COLORS.gold, COLORS.goldBg] }[level]; return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c[3], padding: '5px 12px', borderRadius: 20, fontSize: 12, color: c[2], fontWeight: 800, border: `1.5px solid ${c[2]}30` }}>{c[0]} {c[1]}</div>; };
const Stamps = ({ count }) => <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < count ? COLORS.fioreOrange : COLORS.fioreBeyaz, border: i < count ? `2px solid ${COLORS.fioreOrange}` : `2px dashed ${COLORS.fioreOrange}50`, fontSize: 15 }}>{i < count ? '☕' : <span style={{ color: COLORS.fioreOrange, fontSize: 11, fontWeight: 800 }}>{i + 1}</span>}</div>)}<div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: count >= 7 ? COLORS.green : COLORS.fioreBeyaz, border: count >= 7 ? `2px solid ${COLORS.green}` : `2px dashed ${COLORS.green}` }}>{count >= 7 ? '🎁' : <span style={{ color: COLORS.green, fontSize: 9, fontWeight: 900 }}>FREE</span>}</div></div>;

export default function StaffPanel() {
  const { userData, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
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
  const branch = userData?.branch === 'gokkusagi' ? 'Gökkuşağı AVM' : 'Forum Kampüs AVM';
  const msg = (m, t = 'success') => { setToast(m); setTt(t); setTimeout(() => setToast(null), 2500); };

  // Müşterileri yükle
  useEffect(() => {
    getDocs(collection(db, 'customers')).then(snap => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); const o = { goat: 0, mudavim: 1, misafir: 2 }; list.sort((a, b) => (o[a.level] || 2) - (o[b.level] || 2) || (b.totalStamps || 0) - (a.totalStamps || 0)); setCustomers(list); });
    getDocs(query(collection(db, 'campaigns'), where('active', '==', true))).then(snap => setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
  }, []);

  // GPS kontrolü
  const checkGPS = async () => {
    setGpsChecking(true);
    try {
      const branchDoc = await getDoc(doc(db, 'branches', userData?.branch));
      const branchData = branchDoc.data();
      if (!branchData?.lat || !branchData?.lng) {
        setGps(true); // Koordinat kaydedilmemişse geçici olarak izin ver
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
        () => { setGps(false); setGpsDistance(null); setGpsChecking(false); msg('Konum alınamadı! İzin verin.', 'error'); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (e) { setGps(true); setGpsChecking(false); }
  };

  useEffect(() => { checkGPS(); }, []);

  const doStamp = async () => {
    if (!sel || !gps || (sel.currentCard || 0) >= 7 || busy) return;
    setBusy(true);
    try {
      // 15 dakika kontrolü - son damgayı kontrol et
      const recentQuery = query(
        collection(db, 'stampLogs'),
        where('customerId', '==', sel.id),
        where('type', '==', 'stamp')
      );
      const recentSnap = await getDocs(recentQuery);
      if (!recentSnap.empty) {
        let lastTime = 0;
        recentSnap.docs.forEach(d => {
          const t = d.data().timestamp?.toDate?.()?.getTime() || 0;
          if (t > lastTime) lastTime = t;
        });
        if (lastTime > 0) {
          const diffMin = (Date.now() - lastTime) / 60000;
          if (diffMin < STAMP_CONFIG.minStampIntervalMinutes) {
            const remaining = Math.ceil(STAMP_CONFIG.minStampIntervalMinutes - diffMin);
            msg(`⏱ Son damgadan ${remaining} dk daha beklenmeli!`, 'error');
            setBusy(false);
            return;
          }
        }
      }

      const nc = (sel.currentCard || 0) + 1, nt = (sel.totalStamps || 0) + 1;
      let nl = sel.level;
      if (nt >= 40 && sel.level !== 'goat') nl = 'goat';
      else if (nt >= 16 && sel.level === 'misafir') nl = 'mudavim';
      await updateDoc(doc(db, 'customers', sel.id), { currentCard: nc, totalStamps: nt, level: nl });
      await addDoc(collection(db, 'stampLogs'), { customerId: sel.id, customerName: sel.name, staffId: userData.id, staffName: userData.name, branchId: userData.branch, type: 'stamp', productCategory: cat, cardBefore: sel.currentCard || 0, cardAfter: nc, timestamp: serverTimestamp() });
      const updated = { ...sel, currentCard: nc, totalStamps: nt, level: nl };
      setSel(updated);
      setCustomers(p => p.map(c => c.id === sel.id ? updated : c));
      setTStamp(p => p + 1);
      setLogs(p => [{ cn: sel.name, type: 'stamp', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), cat }, ...p]);
      msg(`☕ Damga! ${sel.name} ${nc}/7`);
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
      const updated = { ...sel, currentCard: 0 };
      setSel(updated);
      setCustomers(p => p.map(c => c.id === sel.id ? updated : c));
      setTFree(p => p + 1);
      setLogs(p => [{ cn: sel.name, type: 'free', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
      msg('🎁 Ücretsiz verildi! Kart 0/7');
    } catch (e) { msg('Hata!', 'error'); }
    setBusy(false);
  };

  const doGoat = async () => {
    if (!sel || sel.level !== 'goat' || sel.goatMonthlyUsed || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'customers', sel.id), { goatMonthlyUsed: true });
      await addDoc(collection(db, 'stampLogs'), { customerId: sel.id, customerName: sel.name, staffId: userData.id, staffName: userData.name, branchId: userData.branch, type: 'goat_monthly', timestamp: serverTimestamp() });
      const updated = { ...sel, goatMonthlyUsed: true };
      setSel(updated);
      setCustomers(p => p.map(c => c.id === sel.id ? updated : c));
      setLogs(p => [{ cn: sel.name, type: 'goat', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
      msg('🐐 GOAT aylık ücretsiz verildi!');
    } catch (e) { msg('Hata!', 'error'); }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {toast && <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: tt === 'success' ? COLORS.green : tt === 'error' ? COLORS.red : COLORS.gold, color: COLORS.fioreBeyaz, padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 340, textAlign: 'center' }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(180deg, #3D2B1F, #2A1810)', padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><img src="/icons/logo-header.png" alt="" style={{ height: 24 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.fioreOrange, fontWeight: 800, letterSpacing: 2 }}>PERSONEL</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.fioreBeyaz, marginTop: 2 }}>{userData?.name}</div>
            <div style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, marginTop: 2 }}>{branch}</div>
          </div>
          <div onClick={logout} style={{ fontSize: 11, color: COLORS.gray, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 8 }}>Çıkış</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        {[[tStamp, 'Damga', '☕', COLORS.fioreOrange], [tFree, 'Ücretsiz', '🎁', COLORS.green]].map(([v, l, ic, c]) => <div key={l} style={{ flex: 1, background: COLORS.fioreBeyaz, borderRadius: 14, padding: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(3,3,3,0.06)' }}><div style={{ fontSize: 18 }}>{ic}</div><div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, color: COLORS.grayDark, fontWeight: 600 }}>{l}</div></div>)}
      </div>

      <div style={{ padding: '0 16px 10px' }}>
        <div onClick={checkGPS} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: gpsChecking ? COLORS.warmGray : gps ? COLORS.greenBg : 'rgba(239,68,68,0.06)', border: `1.5px solid ${gpsChecking ? COLORS.gray : gps ? COLORS.green : COLORS.red}`, cursor: 'pointer' }}>
          <span style={{ fontSize: 16 }}>{gpsChecking ? '⏳' : gps ? '📍' : '❌'}</span>
          <div><div style={{ fontSize: 12, fontWeight: 700, color: gpsChecking ? COLORS.gray : gps ? COLORS.green : COLORS.red }}>{gpsChecking ? 'Konum kontrol ediliyor...' : gps ? 'Şube alanında' : 'Şube dışında!'}</div><div style={{ fontSize: 10, color: COLORS.grayDark }}>{gpsChecking ? '' : gpsDistance !== null ? `${branch} · ${gpsDistance}m` : gps ? `${branch} · Koordinat henüz kaydedilmemiş` : 'İşlem yapılamaz'}</div></div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.blue, fontWeight: 700 }}>🔄 Yenile</span>
        </div>
      </div>

      {/* Aktif Kampanyalar */}
      {campaigns.length > 0 && <div style={{ padding: '0 16px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.grayDark, marginBottom: 6 }}>📢 Aktif Kampanyalar</div>
        {campaigns.map(c => (
          <div key={c.id} style={{ background: COLORS.orangeGlow, borderRadius: 10, padding: '10px 14px', marginBottom: 4, border: `1.5px solid ${COLORS.fioreOrange}30` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreOrange }}>{c.title}</div>
            {c.description && <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 2 }}>{c.description}</div>}
            <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>Hedef: {c.target === 'all' ? 'Tüm Üyeler' : c.target === 'goat' ? 'GOAT' : c.target === 'mudavim' ? 'Müdavim' : 'Yeni Üyeler'}</div>
          </div>
        ))}
      </div>}

      {!sel && <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Müşteri QR Okut:</div>
        {customers.map(c => <div key={c.id} onClick={() => { setSel(c); setStep(null); setCat(null); }} style={{ background: COLORS.fioreBeyaz, borderRadius: 14, padding: '14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: `1.5px solid ${COLORS.grayLight}` }}>
          <span style={{ fontSize: 22 }}>{c.level === 'goat' ? '🐐' : c.level === 'mudavim' ? '⭐' : '☕'}</span>
          <div><div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: COLORS.grayDark }}>{c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} · {c.currentCard || 0}/7</div></div>
        </div>)}
      </div>}

      {sel && <div style={{ padding: '0 16px 16px' }}>
        <Card border={`2px solid ${sel.level === 'goat' ? COLORS.gold : COLORS.green}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><span>✅</span><span style={{ fontSize: 13, fontWeight: 800, color: COLORS.green }}>Müşteri Bulundu</span>{sel.level === 'goat' && <Badge text="🐐 GOAT" color={COLORS.gold} />}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{sel.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><LvBadge level={sel.level} /><span style={{ fontSize: 12, color: COLORS.grayDark, fontWeight: 600 }}>· {sel.currentCard || 0}/7</span></div>
          <Stamps count={sel.currentCard || 0} />

          {sel.level === 'goat' && <div style={{ background: COLORS.goldBg, borderRadius: 12, padding: '12px', marginTop: 12, border: `1.5px solid ${COLORS.gold}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.gold, marginBottom: 6 }}>🐐 GOAT DURUM</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: COLORS.grayDark }}>Aylık ücretsiz:</span><span style={{ color: sel.goatMonthlyUsed ? COLORS.gray : COLORS.green, fontWeight: 700 }}>{sel.goatMonthlyUsed ? '✗ Kullanıldı' : '✓ Kullanılmadı'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}><span style={{ color: COLORS.grayDark }}>%10 indirim:</span><span style={{ color: COLORS.gold, fontWeight: 700 }}>Aktif</span></div>
          </div>}

          {!step && <><div style={{ marginTop: 14, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>İşlem Seç:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn onClick={() => { if ((sel.currentCard || 0) >= 7) { msg('Kart dolu!', 'error'); return; } setStep('cat'); }} disabled={!gps || (sel.currentCard || 0) >= 7}>{'☕ Damga Ekle' + (sel.level === 'goat' ? ' (%10 indirimli)' : '')}</Btn>
            {sel.level === 'goat' && <Btn onClick={doGoat} disabled={!gps || sel.goatMonthlyUsed} color={COLORS.gold}>🐐 GOAT Aylık Ücretsiz</Btn>}
            <Btn onClick={doFree} disabled={!gps || (sel.currentCard || 0) < 7} color={COLORS.green}>🎁 Sadakat Ücretsiz (sıfırlanır)</Btn>
          </div></>}

          {step === 'cat' && <><div style={{ marginTop: 14, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Müşteri ne aldı?</div>
            {STAMP_CATEGORIES.map(x => <div key={x.id} onClick={() => { if (!x.eligible) { msg(x.name + ' damga kazandırmaz!', 'error'); return; } setCat(x.id); setStep('ok'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, marginBottom: 5, cursor: 'pointer', background: x.eligible ? COLORS.fioreBeyaz : COLORS.warmGray, border: `1.5px solid ${x.eligible ? COLORS.green : COLORS.grayLight}`, opacity: x.eligible ? 1 : 0.5 }}><span style={{ fontSize: 18 }}>{x.icon}</span><div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: x.eligible ? COLORS.fioreSiyah : COLORS.gray }}>{x.name}</div><span style={{ fontSize: 14, color: x.eligible ? COLORS.green : COLORS.red, fontWeight: 800 }}>{x.eligible ? '✓' : '✗'}</span></div>)}
            <div onClick={() => setStep(null)} style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>← Geri</div>
          </>}

          {step === 'ok' && <div style={{ marginTop: 14, background: COLORS.orangeGlow, borderRadius: 14, padding: 16, border: `2px solid ${COLORS.fioreOrange}`, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Damga Onayı</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{sel.name}</div>
            <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 6 }}>{STAMP_CATEGORIES.find(c => c.id === cat)?.icon} {STAMP_CATEGORIES.find(c => c.id === cat)?.name}</div>
            <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 4 }}>Kart: {sel.currentCard || 0}/7 → {(sel.currentCard || 0) + 1}/7</div>
            {sel.level === 'goat' && <div style={{ marginTop: 6 }}><Badge text="💰 %10 indirim uygula" color={COLORS.gold} /></div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><div style={{ flex: 1 }}><Btn onClick={doStamp} color={COLORS.green}>✓ Onayla</Btn></div><div style={{ flex: 1 }}><Btn onClick={() => { setStep('cat'); setCat(null); }} color={COLORS.gray}>← Geri</Btn></div></div>
          </div>}

          {!gps && <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 14px', marginTop: 10, border: `1.5px solid ${COLORS.red}` }}><div style={{ fontSize: 12, fontWeight: 700, color: COLORS.red }}>❌ Şube dışındasınız!</div></div>}
          <div onClick={() => { setSel(null); setStep(null); setCat(null); }} style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>← Başka müşteri seç</div>
        </Card>
      </div>}

      {logs.length > 0 && <div style={{ padding: '0 16px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Son İşlemler</div>
        {logs.slice(0, 5).map((l, i) => <div key={i} style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span style={{ fontSize: 13, fontWeight: 700 }}>{l.cn}</span><span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8 }}>{l.time}</span></div><Badge text={l.type === 'stamp' ? 'DAMGA' : l.type === 'goat' ? 'GOAT' : 'ÜCRETSİZ'} color={l.type === 'stamp' ? COLORS.fioreOrange : l.type === 'goat' ? COLORS.gold : COLORS.green} /></div>)}
      </div>}
    </div>
  );
}
