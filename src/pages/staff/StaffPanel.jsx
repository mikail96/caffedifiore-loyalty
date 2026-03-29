import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { COLORS, STAMP_CATEGORIES, BRANCHES } from '../../config/constants.js';

const Card = ({ children, style = {}, border }) => (
  <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', border: border || 'none', ...style }}>
    {children}
  </div>
);

const Btn = ({ children, color = COLORS.fioreOrange, disabled = false, onClick }) => (
  <div
    onClick={disabled ? undefined : onClick}
    style={{
      background: disabled ? COLORS.grayLight : color,
      color: disabled ? COLORS.gray : COLORS.fioreBeyaz,
      borderRadius: 14, padding: '14px', textAlign: 'center',
      fontWeight: 800, fontSize: 14, width: '100%',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
    }}
  >
    {children}
  </div>
);

const Badge = ({ text, color = COLORS.fioreOrange }) => (
  <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.fioreBeyaz, background: color, padding: '3px 10px', borderRadius: 10 }}>{text}</span>
);

const LevelBadge = ({ level }) => {
  const cfg = {
    misafir: { icon: '☕', label: 'Fiore Misafir', color: COLORS.gray },
    mudavim: { icon: '⭐', label: 'Fiore Müdavim', color: COLORS.fioreOrange },
    goat: { icon: '🐐', label: 'Fiore GOAT', color: COLORS.gold },
  }[level];
  return <Badge text={`${cfg.icon} ${cfg.label}`} color={cfg.color} />;
};

const StampDots = ({ count, total = 7 }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{
        width: 34, height: 34, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: i < count ? COLORS.fioreOrange : COLORS.fioreBeyaz,
        border: `2px ${i < count ? 'solid' : 'dashed'} ${i < count ? COLORS.fioreOrange : COLORS.fioreOrange + '50'}`,
        fontSize: 15,
      }}>
        {i < count ? '☕' : <span style={{ color: COLORS.fioreOrange, fontSize: 11, fontWeight: 800 }}>{i + 1}</span>}
      </div>
    ))}
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: count >= total ? COLORS.green : COLORS.fioreBeyaz,
      border: `2px ${count >= total ? 'solid' : 'dashed'} ${COLORS.green}`,
    }}>
      {count >= total ? '🎁' : <span style={{ color: COLORS.green, fontSize: 9, fontWeight: 900 }}>FREE</span>}
    </div>
  </div>
);

export default function StaffPanel() {
  const { userData, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [step, setStep] = useState(null); // null | 'category' | 'confirm'
  const [selectedCat, setSelectedCat] = useState(null);
  const [gpsOk, setGpsOk] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ stamps: 0, free: 0 });

  const branchName = BRANCHES[userData?.branch]?.shortName || userData?.branch || '';

  const showToast = (msg, type = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(null), 2500);
  };

  // Müşterileri yükle
  useEffect(() => {
    const loadCustomers = async () => {
      const snapshot = await getDocs(collection(db, 'customers'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // GOAT > Müdavim > Misafir sırala
      const order = { goat: 0, mudavim: 1, misafir: 2 };
      list.sort((a, b) => (order[a.level] || 2) - (order[b.level] || 2) || (b.totalStamps || 0) - (a.totalStamps || 0));
      setCustomers(list);
    };
    loadCustomers();
  }, []);

  // Müşteri seçildiğinde güncel verisini al
  const selectCustomer = async (id) => {
    const snap = await getDoc(doc(db, 'customers', id));
    if (snap.exists()) {
      setSelectedCustomer({ id: snap.id, ...snap.data() });
      setStep(null);
      setSelectedCat(null);
    }
  };

  // Damga ekle
  const doStamp = async () => {
    if (!selectedCustomer || !gpsOk || loading) return;
    const c = selectedCustomer;
    if (c.currentCard >= 7) { showToast('Kart dolu! Önce ücretsiz verin.', 'error'); return; }

    setLoading(true);
    try {
      const newCard = (c.currentCard || 0) + 1;
      const newTotal = (c.totalStamps || 0) + 1;
      let newLevel = c.level;
      if (newTotal >= 40 && c.level !== 'goat') newLevel = 'goat';
      else if (newTotal >= 16 && c.level === 'misafir') newLevel = 'mudavim';

      await updateDoc(doc(db, 'customers', c.id), {
        currentCard: newCard,
        totalStamps: newTotal,
        level: newLevel,
      });

      await addDoc(collection(db, 'stampLogs'), {
        customerId: c.id, customerName: c.name,
        staffId: userData.id, staffName: userData.name,
        branchId: userData.branch,
        type: 'stamp', productCategory: selectedCat,
        cardBefore: c.currentCard || 0, cardAfter: newCard,
        timestamp: serverTimestamp(),
      });

      setStats(p => ({ ...p, stamps: p.stamps + 1 }));
      setLogs(p => [{ type: 'stamp', cn: c.name, cat: selectedCat, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);

      showToast(`☕ Damga eklendi! ${c.name} ${newCard}/7`);
      if (newLevel !== c.level) setTimeout(() => showToast(`🎉 ${c.name} ${newLevel.toUpperCase()} oldu!`, 'warning'), 1500);

      setSelectedCustomer({ ...c, currentCard: newCard, totalStamps: newTotal, level: newLevel });
      setStep(null); setSelectedCat(null);
    } catch (err) {
      console.error(err);
      showToast('Hata oluştu!', 'error');
    }
    setLoading(false);
  };

  // Sadakat ücretsiz ver
  const doFreeReward = async () => {
    if (!selectedCustomer || loading) return;
    const c = selectedCustomer;
    if (c.currentCard < 7) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'customers', c.id), { currentCard: 0 });
      await addDoc(collection(db, 'stampLogs'), {
        customerId: c.id, customerName: c.name,
        staffId: userData.id, staffName: userData.name,
        branchId: userData.branch, type: 'free_redeemed',
        timestamp: serverTimestamp(),
      });

      setStats(p => ({ ...p, free: p.free + 1 }));
      setLogs(p => [{ type: 'free', cn: c.name, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
      showToast('🎁 Ücretsiz kahve verildi! Kart sıfırlandı.');
      setSelectedCustomer({ ...c, currentCard: 0 });
    } catch (err) {
      showToast('Hata oluştu!', 'error');
    }
    setLoading(false);
  };

  // GOAT aylık ücretsiz
  const doGoatMonthly = async () => {
    if (!selectedCustomer || loading) return;
    const c = selectedCustomer;
    if (c.level !== 'goat' || c.goatMonthlyUsed) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'customers', c.id), { goatMonthlyUsed: true });
      await addDoc(collection(db, 'stampLogs'), {
        customerId: c.id, customerName: c.name,
        staffId: userData.id, staffName: userData.name,
        branchId: userData.branch, type: 'goat_monthly',
        timestamp: serverTimestamp(),
      });

      setLogs(p => [{ type: 'goat', cn: c.name, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
      showToast('🐐 GOAT aylık ücretsiz verildi!');
      setSelectedCustomer({ ...c, goatMonthlyUsed: true });
    } catch (err) {
      showToast('Hata oluştu!', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: toastType === 'success' ? COLORS.green : toastType === 'error' ? COLORS.red : COLORS.gold, color: COLORS.fioreBeyaz, padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 320, textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #3D2B1F, #2A1810)', padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/icons/logo-header.png" alt="" style={{ height: 24 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.fioreOrange, fontWeight: 800, letterSpacing: 2 }}>PERSONEL</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.fioreBeyaz, marginTop: 2 }}>{userData?.name}</div>
            <div style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, marginTop: 3 }}>{branchName}</div>
          </div>
          <div onClick={logout} style={{ fontSize: 11, color: COLORS.gray, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 8 }}>Çıkış</div>
        </div>
      </div>

      {/* İstatistik */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        {[[stats.stamps, 'Bugün Damga', '☕'], [stats.free, 'Ücretsiz', '🎁']].map(([v, l, ic]) => (
          <div key={l} style={{ flex: 1, background: COLORS.fioreBeyaz, borderRadius: 14, padding: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(3,3,3,0.06)' }}>
            <div style={{ fontSize: 18 }}>{ic}</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
            <div style={{ fontSize: 10, color: COLORS.grayDark, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* GPS Durumu */}
      <div style={{ padding: '0 16px 10px' }}>
        <div
          onClick={() => setGpsOk(!gpsOk)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: gpsOk ? COLORS.greenBg : 'rgba(239,68,68,0.06)',
            border: `1.5px solid ${gpsOk ? COLORS.green : COLORS.red}`,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16 }}>{gpsOk ? '📍' : '❌'}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: gpsOk ? COLORS.green : COLORS.red }}>
              {gpsOk ? 'Şube alanında' : 'Şube dışında!'}
            </div>
            <div style={{ fontSize: 10, color: COLORS.grayDark, fontWeight: 500 }}>
              {gpsOk ? `${branchName} · 12m` : 'İşlem yapılamaz'}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.gray, fontWeight: 600 }}>Test</span>
        </div>
      </div>

      {/* Müşteri Seçimi */}
      {!selectedCustomer && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Müşteri QR Okut:</div>
          {customers.map(c => (
            <div
              key={c.id}
              onClick={() => selectCustomer(c.id)}
              style={{
                background: COLORS.fioreBeyaz, borderRadius: 14, padding: '14px',
                marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', border: `1.5px solid ${COLORS.grayLight}`,
                boxShadow: '0 1px 6px rgba(3,3,3,0.04)',
              }}
            >
              <span style={{ fontSize: 22 }}>{c.level === 'goat' ? '🐐' : c.level === 'mudavim' ? '⭐' : '☕'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: COLORS.grayDark, fontWeight: 600 }}>
                  {c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} · {c.currentCard || 0}/7
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seçilen Müşteri */}
      {selectedCustomer && (
        <div style={{ padding: '0 16px 20px' }}>
          <Card border={`2px solid ${selectedCustomer.level === 'goat' ? COLORS.gold : COLORS.green}`}>

            {/* Müşteri bilgisi */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.green }}>Müşteri Bulundu</span>
              {selectedCustomer.level === 'goat' && <Badge text="🐐 GOAT" color={COLORS.gold} />}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedCustomer.name}</div>
            <div style={{ marginTop: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LevelBadge level={selectedCustomer.level} />
              <span style={{ fontSize: 12, color: COLORS.grayDark, fontWeight: 700 }}>· {selectedCustomer.currentCard || 0}/7</span>
            </div>
            <StampDots count={selectedCustomer.currentCard || 0} />

            {/* GOAT durumu */}
            {selectedCustomer.level === 'goat' && (
              <div style={{ background: COLORS.goldBg, borderRadius: 12, padding: '12px', marginTop: 12, border: `1.5px solid ${COLORS.gold}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.gold, marginBottom: 6 }}>🐐 GOAT DURUM</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: COLORS.grayDark, fontWeight: 500 }}>Aylık ücretsiz:</span>
                  <span style={{ color: selectedCustomer.goatMonthlyUsed ? COLORS.gray : COLORS.green, fontWeight: 700 }}>
                    {selectedCustomer.goatMonthlyUsed ? '✗ Kullanıldı' : '✓ Kullanılmadı'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                  <span style={{ color: COLORS.grayDark, fontWeight: 500 }}>%10 indirim:</span>
                  <span style={{ color: COLORS.gold, fontWeight: 700 }}>Her zaman aktif</span>
                </div>
              </div>
            )}

            {/* ADIM 1: İşlem Seç */}
            {!step && (
              <>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>İşlem Seç:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Btn
                    onClick={() => { if ((selectedCustomer.currentCard || 0) >= 7) { showToast('Kart dolu!', 'error'); return; } setStep('category'); }}
                    disabled={!gpsOk || (selectedCustomer.currentCard || 0) >= 7}
                  >
                    {'☕ Damga Ekle' + (selectedCustomer.level === 'goat' ? ' (%10 indirimli)' : '')}
                  </Btn>
                  {selectedCustomer.level === 'goat' && (
                    <Btn onClick={doGoatMonthly} disabled={!gpsOk || selectedCustomer.goatMonthlyUsed} color={COLORS.gold}>
                      🐐 GOAT Aylık Ücretsiz
                    </Btn>
                  )}
                  <Btn onClick={doFreeReward} disabled={!gpsOk || (selectedCustomer.currentCard || 0) < 7} color={COLORS.green}>
                    🎁 Sadakat Ücretsiz (kart sıfırlanır)
                  </Btn>
                </div>
              </>
            )}

            {/* ADIM 2: Kategori Seç */}
            {step === 'category' && (
              <>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Müşteri ne aldı?</div>
                <div style={{ fontSize: 11, color: COLORS.grayDark, marginBottom: 10, fontWeight: 500 }}>Yeşil = damga kazandırır</div>
                {STAMP_CATEGORIES.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (!cat.eligible) { showToast(`${cat.name} damga kazandırmaz!`, 'error'); return; }
                      setSelectedCat(cat.id); setStep('confirm');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 12, marginBottom: 5,
                      cursor: 'pointer',
                      background: cat.eligible ? COLORS.fioreBeyaz : COLORS.warmGray,
                      border: `1.5px solid ${cat.eligible ? COLORS.green : COLORS.grayLight}`,
                      opacity: cat.eligible ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: cat.eligible ? COLORS.fioreSiyah : COLORS.gray }}>{cat.name}</div>
                    </div>
                    <span style={{ color: cat.eligible ? COLORS.green : COLORS.red, fontWeight: 800, fontSize: 14 }}>
                      {cat.eligible ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
                <div onClick={() => setStep(null)} style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>
                  ← Geri
                </div>
              </>
            )}

            {/* ADIM 3: Onay */}
            {step === 'confirm' && (
              <div style={{ marginTop: 14, background: COLORS.orangeGlow, borderRadius: 14, padding: 16, border: `2px solid ${COLORS.fioreOrange}`, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Damga Onayı</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 6, fontWeight: 600 }}>
                  {STAMP_CATEGORIES.find(c => c.id === selectedCat)?.icon} {STAMP_CATEGORIES.find(c => c.id === selectedCat)?.name}
                </div>
                <div style={{ fontSize: 13, color: COLORS.grayDark, marginTop: 4, fontWeight: 600 }}>
                  Kart: {selectedCustomer.currentCard || 0}/7 → {(selectedCustomer.currentCard || 0) + 1}/7
                </div>
                {selectedCustomer.level === 'goat' && (
                  <div style={{ marginTop: 6 }}>
                    <Badge text="💰 %10 indirim uygula" color={COLORS.gold} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <div style={{ flex: 1 }}><Btn onClick={doStamp} color={COLORS.green}>✓ Onayla</Btn></div>
                  <div style={{ flex: 1 }}><Btn onClick={() => { setStep('category'); setSelectedCat(null); }} color={COLORS.gray}>← Geri</Btn></div>
                </div>
              </div>
            )}

            {/* GPS uyarısı */}
            {!gpsOk && (
              <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 14px', marginTop: 10, border: `1.5px solid ${COLORS.red}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.red }}>❌ Şube dışındasın. İşlem yapılamaz.</div>
              </div>
            )}

            {/* Başka müşteri */}
            <div
              onClick={() => { setSelectedCustomer(null); setStep(null); setSelectedCat(null); }}
              style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}
            >
              ← Başka müşteri
            </div>
          </Card>
        </div>
      )}

      {/* Son İşlemler */}
      {logs.length > 0 && (
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Son İşlemler</div>
          {logs.slice(0, 5).map((l, i) => (
            <div key={i} style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(3,3,3,0.04)' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{l.cn}</span>
                <span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8, fontWeight: 500 }}>{l.time}</span>
              </div>
              <Badge
                text={l.type === 'stamp' ? 'DAMGA' : l.type === 'goat' ? 'GOAT' : 'ÜCRETSİZ'}
                color={l.type === 'stamp' ? COLORS.fioreOrange : l.type === 'goat' ? COLORS.gold : COLORS.green}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
