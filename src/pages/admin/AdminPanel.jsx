import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, setDoc, serverTimestamp, increment, query, where } from 'firebase/firestore';
import { COLORS, FONTS, STAMP_CATEGORIES, STAMP_CONFIG } from '../../config/constants.js';
import { MENU_DATA } from '../../config/menu-data.js';
import { loadMenu, groupByCategory, getCategories } from '../../services/menuService.js';
import { calculateLevel, hashPin } from '../../utils/helpers.js';

const f = FONTS;
const C = ({ children, style = {}, border }) => <div style={{ background: COLORS.cardBg, borderRadius: 22, padding: 18, border: border || `1px solid ${COLORS.divider}`, fontFamily: f.body, ...style }}>{children}</div>;
const B = ({ text, color = COLORS.fioreOrange }) => <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.fioreBeyaz, background: color, padding: '4px 12px', borderRadius: 20, fontFamily: f.body }}>{text}</span>;
const Bt = ({ children, color = COLORS.fioreOrange, onClick, sm, disabled }) => <div onClick={disabled ? undefined : onClick} style={{ background: disabled ? COLORS.grayLight : color, color: disabled ? COLORS.gray : COLORS.fioreBeyaz, borderRadius: sm ? 12 : 50, padding: sm ? '8px 14px' : '14px', textAlign: 'center', fontWeight: 700, fontSize: sm ? 12 : 14, cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', opacity: disabled ? 0.4 : 1, fontFamily: f.body }}>{children}</div>;
const Inp = ({ label, value, onChange, placeholder, type = 'text' }) => <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: COLORS.grayDark, marginBottom: 5, fontFamily: f.body }}>{label}</div><input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${COLORS.divider}`, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: f.body, color: COLORS.fioreBeyaz, background: COLORS.warmGray }} /></div>;

const tabs = [
  { id: 'dash', label: 'Dashboard' },
  { id: 'qr', label: 'QR' },
  { id: 'cust', label: 'Müşteri' },
  { id: 'staff', label: 'Personel' },
  { id: 'branch', label: 'Şube' },
  { id: 'camp', label: 'Kampanya' },
  { id: 'menu', label: 'Menü' },
  { id: 'logs', label: 'Log' },
];

export default function AdminPanel() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('dash');
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [stampLogs, setStampLogs] = useState([]);
  const [branches, setBranches] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  // Edit states
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newStaff, setNewStaff] = useState({ name: '', username: '', pin: '', role: 'Barista', branch: '' });
  const [newCamp, setNewCamp] = useState({ title: '', desc: '', target: 'all' });
  const [newBranch, setNewBranch] = useState({ name: '', shortName: '' });
  const [newMenu, setNewMenu] = useState({ name: '', category: '', price14oz: '', price16oz: '', price: '', type: 'hot', categoryIcon: '', priceType: 'dual', sizeLabel: '' });
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuEditForm, setMenuEditForm] = useState({});
  const [adminEdit, setAdminEdit] = useState(null);
  const [adminForm, setAdminForm] = useState({ username: '', password: '', phone: '' });
  const [editingCust, setEditingCust] = useState(null);
  // QR states
  const [qrSel, setQrSel] = useState(null); // selected customer from QR
  const [qrStep, setQrStep] = useState(null); // 'cat' | 'confirm'
  const [qrCat, setQrCat] = useState(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const qrRef = useRef(null);
  const scannerRef = useRef(null);
  const [sizes, setSizes] = useState({ hotSmall: '14oz', hotLarge: '16oz', coldSize: '16oz' });
  const [editingSizes, setEditingSizes] = useState(false);
  const [sizesForm, setSizesForm] = useState({});

  const msg = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const load = async () => {
      const [custSnap, staffSnap, logSnap, brSnap, campSnap] = await Promise.all([
        getDocs(collection(db, 'customers')), getDocs(collection(db, 'staff')),
        getDocs(collection(db, 'stampLogs')), getDocs(collection(db, 'branches')),
        getDocs(collection(db, 'campaigns')),
      ]);
      // Menüyü ayrı yükle (ilk seferde seed eder)
      const menuList = await loadMenu();
      const cList = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const o = { goat: 0, mudavim: 1, misafir: 2 };
      cList.sort((a, b) => (o[a.level] || 2) - (o[b.level] || 2) || (b.totalStamps || 0) - (a.totalStamps || 0));
      setCustomers(cList);
      setStaffList(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const ll = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      ll.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setStampLogs(ll);
      const br = {}; brSnap.docs.forEach(d => { br[d.id] = d.data(); }); setBranches(br);
      const cl = campSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      cl.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCampaigns(cl);
      setMenuItems(menuList);
      // Boyut ayarlarını yükle
      try {
        const sizesDoc = await getDoc(doc(db, 'settings', 'sizes'));
        if (sizesDoc.exists()) setSizes(sizesDoc.data());
      } catch (e) {}
    };
    load();
  }, []);

  const goatCount = customers.filter(c => c.level === 'goat').length;
  const filtered = search ? customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)) : customers;
  const branchKeys = Object.keys(branches);

  // Müşteri damga düzenle
  const adjustStamp = async (custId, delta) => {
    const c = customers.find(x => x.id === custId);
    if (!c) return;
    let newCard = Math.max(0, Math.min(7, (c.currentCard || 0) + delta));
    let newTotal = Math.max(0, (c.totalStamps || 0) + delta);
    let nl = c.level;
    if (newTotal >= 40 && c.level !== 'goat') nl = 'goat';
    else if (newTotal >= 16 && newTotal < 40) nl = 'mudavim';
    else if (newTotal < 16) nl = 'misafir';
    await updateDoc(doc(db, 'customers', custId), { currentCard: newCard, totalStamps: newTotal, level: nl });
    setCustomers(p => p.map(x => x.id === custId ? { ...x, currentCard: newCard, totalStamps: newTotal, level: nl } : x));
    const now = new Date();
    const logEntry = { customerId: custId, customerName: c.name, staffId: 'admin', staffName: 'Admin', branchId: 'admin', type: delta > 0 ? 'admin_add' : 'admin_remove', cardAfter: newCard, timestamp: { seconds: now.getTime() / 1000, toDate: () => now } };
    await addDoc(collection(db, 'stampLogs'), { ...logEntry, timestamp: serverTimestamp() });
    setStampLogs(p => [logEntry, ...p]);

    // Referans bonus: İlk damgada referans sahibine +1 damga
    if (delta > 0 && newTotal === 1 && c.referredBy) {
      try {
        const refDoc = await getDoc(doc(db, 'customers', c.referredBy));
        if (refDoc.exists()) {
          const rd = refDoc.data();
          const rnc = (rd.currentCard || 0) + 1 > 7 ? rd.currentCard || 0 : (rd.currentCard || 0) + 1;
          const rnt = (rd.totalStamps || 0) + 1;
          let rnl = rd.level;
          if (rnt >= 40 && rd.level !== 'goat') rnl = 'goat';
          else if (rnt >= 16 && rd.level === 'misafir') rnl = 'mudavim';
          await updateDoc(doc(db, 'customers', c.referredBy), { currentCard: rnc, totalStamps: rnt, level: rnl });
          setCustomers(p => p.map(x => x.id === c.referredBy ? { ...x, currentCard: rnc, totalStamps: rnt, level: rnl } : x));
          await addDoc(collection(db, 'stampLogs'), { customerId: c.referredBy, customerName: rd.name, staffId: 'admin', staffName: 'Referans Bonus', branchId: 'admin', type: 'referral_bonus', cardAfter: rnc, timestamp: serverTimestamp() });
          msg(`✓ ${rd.name} referans bonusu aldı!`);
        }
      } catch (e) { console.error('Referans bonus hatası:', e); }
    }

    msg(`✓ ${c.name}: ${delta > 0 ? '+1 damga' : '-1 damga'} → ${newCard}/7 (toplam: ${newTotal})`);
  };

  const resetCard = async (custId) => {
    const c = customers.find(x => x.id === custId);
    if (!c) return;
    await updateDoc(doc(db, 'customers', custId), { currentCard: 0 });
    setCustomers(p => p.map(x => x.id === custId ? { ...x, currentCard: 0 } : x));
    msg(`✓ ${c.name} kartı sıfırlandı (0/7)`);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      {toast && <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: COLORS.green, color: COLORS.fioreBeyaz, padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 340, textAlign: 'center' }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(170deg, #3D2B1F, #261810)', padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><img src="/icons/logo-white.png" alt="" style={{ height: 28 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 3 }}>ADMİN PANELİ</div><div style={{ fontSize: 20, fontWeight: 700, color: COLORS.fioreBeyaz, marginTop: 4 }}>Merhaba Mikail</div></div>
          <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: COLORS.fioreOrange, cursor: 'pointer', background: COLORS.orangeGlow, padding: '6px 14px', borderRadius: 50, fontWeight: 600, border: '1px solid rgba(236,103,26,0.15)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Çıkış</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', background: COLORS.cardBg, borderBottom: `1px solid ${COLORS.grayLight}`, overflowX: 'auto' }}>
        {tabs.map(t => <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: tab === t.id ? COLORS.fioreSiyah : 'transparent', color: tab === t.id ? COLORS.fioreBeyaz : COLORS.gray }}>{t.label}</div>)}
      </div>

      {/* ===== DASHBOARD ===== */}
      {tab === 'dash' && <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[['Üye', customers.length, COLORS.fioreOrange], ['Damga', stampLogs.filter(l => l.type === 'stamp').length, COLORS.blue], ['Ücretsiz', stampLogs.filter(l => l.type !== 'stamp' && l.type !== 'admin_add' && l.type !== 'admin_remove').length, COLORS.green], ['GOAT', goatCount, COLORS.gold]].map(([l, v, c]) => <C key={l}><div style={{ width: 8, height: 8, borderRadius: '50%', background: c, marginBottom: 10 }} /><div style={{ fontSize: 26, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: COLORS.gray, fontWeight: 500, marginTop: 2 }}>{l}</div></C>)}
        </div>
        <C><div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>En İyiler</div>
          {customers.slice(0, 5).map((c, i) => <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? `1px solid ${COLORS.warmGray}` : 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: c.level === 'goat' ? COLORS.goldBg : COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange }}>{c.name?.charAt(0)}</div><div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreBeyaz }}>{c.name} </span><B text={c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange} /></div><span style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreOrange }}>{c.totalStamps || 0}</span></div>)}
        </C>
        {/* Admin Ayarları */}
        <C style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminEdit ? 12 : 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>Admin Ayarları</div>
            {!adminEdit && <div onClick={async () => { const snap = await getDocs(collection(db, 'settings')); const ad = snap.docs.find(d => d.id === 'admin'); if (ad) { const d = ad.data(); setAdminForm({ username: d.username || '', password: d.password || '', phone: d.phone || '' }); setAdminEdit(true); } }} style={{ fontSize: 12, color: COLORS.blue, fontWeight: 700, cursor: 'pointer', background: COLORS.blueBg, padding: '5px 12px', borderRadius: 8 }}>Düzenle</div>}
          </div>
          {adminEdit && <div>
            <Inp label="Kullanıcı Adı" value={adminForm.username} onChange={v => setAdminForm(p => ({ ...p, username: v }))} />
            <Inp label="Şifre" value={adminForm.password} onChange={v => setAdminForm(p => ({ ...p, password: v }))} />
            <Inp label="Telefon" value={adminForm.phone} onChange={v => setAdminForm(p => ({ ...p, phone: v }))} placeholder="+905XXXXXXXXX" />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><Bt onClick={async () => {
                const updates = { ...adminForm };
                // Şifre değiştiyse hashle (64 karakter hash değilse yeni şifre)
                if (updates.password && updates.password.length < 60) {
                  updates.password = await hashPin(updates.password);
                }
                await updateDoc(doc(db, 'settings', 'admin'), updates);
                setAdminEdit(null); msg('Admin güncellendi!');
              }} color={COLORS.green} sm>Kaydet</Bt></div>
              <div style={{ flex: 1 }}><Bt onClick={() => setAdminEdit(null)} color={COLORS.gray} sm>İptal</Bt></div>
            </div>
          </div>}
        </C>
      </div>}

      {/* ===== ADMIN QR ===== */}
      {tab === 'qr' && <div style={{ padding: '14px 16px' }}>
        {!qrSel ? (
          <C>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12, textAlign: 'center' }}>Müşteri QR Kodunu Okut</div>
            <div id="admin-qr-reader" ref={qrRef} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }} />
            {!scanning ? (
              <Bt onClick={async () => {
                setScanning(true);
                try {
                  const scanner = new Html5Qrcode('admin-qr-reader');
                  scannerRef.current = scanner;
                  await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, async (text) => {
                    try { await scanner.stop(); } catch(e) {}
                    setScanning(false);
                    if (!text.startsWith('CDF:')) { msg('Geçersiz QR kod!'); return; }
                    const phone = text.split(':')[1];
                    const q = query(collection(db, 'customers'), where('phone', '==', phone));
                    const snap = await getDocs(q);
                    if (snap.empty) { msg('Müşteri bulunamadı!'); return; }
                    const d = snap.docs[0];
                    setQrSel({ id: d.id, ...d.data() });
                    msg(d.data().name + ' bulundu!');
                  });
                } catch (e) { msg('Kamera açılamadı'); setScanning(false); }
              }}>Kamerayı Aç</Bt>
            ) : (
              <Bt onClick={async () => { try { await scannerRef.current?.stop(); } catch(e) {} setScanning(false); }} color={COLORS.gray}>Kamerayı Kapat</Bt>
            )}
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: COLORS.grayDark }}>Konum kısıtlaması yok — her yerden işlem yapabilirsiniz</div>
          </C>
        ) : (
          <div>
            {/* Müşteri bilgisi */}
            <C style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: qrSel.level === 'goat' ? COLORS.goldBg : COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: qrSel.level === 'goat' ? COLORS.gold : COLORS.fioreOrange }}>{qrSel.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.fioreBeyaz }}>{qrSel.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.grayDark }}>Kart: {qrSel.currentCard || 0}/7 · Toplam: {qrSel.totalStamps || 0}</div>
                </div>
                <B text={qrSel.level === 'goat' ? 'GOAT' : qrSel.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={qrSel.level === 'goat' ? COLORS.gold : COLORS.fioreOrange} />
              </div>
              {/* Damga göstergesi */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < (qrSel.currentCard||0) ? COLORS.fioreOrange : 'transparent', border: i < (qrSel.currentCard||0) ? 'none' : `1.5px solid ${COLORS.warmGray}` }}>
                    {i < (qrSel.currentCard||0) ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.fioreSiyah} strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17L4 12"/></svg> : <span style={{ color: COLORS.gray, fontSize: 10, fontWeight: 600 }}>{i+1}</span>}
                  </div>
                ))}
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (qrSel.currentCard||0) >= 7 ? COLORS.green : 'transparent', border: (qrSel.currentCard||0) >= 7 ? 'none' : `1.5px dashed ${COLORS.green}60` }}>
                  {(qrSel.currentCard||0) >= 7 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17L4 12"/></svg> : <span style={{ color: COLORS.green, fontSize: 9, fontWeight: 800 }}>FREE</span>}
                </div>
              </div>
            </C>

            {/* İşlem seçimi */}
            {!qrStep && <C style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>İşlem Seç</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Bt onClick={() => setQrStep('cat')} disabled={(qrSel.currentCard||0) >= 7}>Damga Ekle</Bt>
                <Bt onClick={async () => {
                  if ((qrSel.currentCard||0) < 7 || qrBusy) return;
                  setQrBusy(true);
                  await updateDoc(doc(db, 'customers', qrSel.id), { currentCard: 0 });
                  await addDoc(collection(db, 'stampLogs'), { customerId: qrSel.id, customerName: qrSel.name, staffId: 'admin', staffName: 'Admin QR', branchId: 'admin', type: 'free_redeemed', timestamp: serverTimestamp() });
                  setQrSel({ ...qrSel, currentCard: 0 });
                  msg('Sadakat ücretsiz verildi! Kart 0/7');
                  setQrBusy(false);
                }} disabled={(qrSel.currentCard||0) < 7} color={COLORS.green}>Sadakat Ücretsiz</Bt>
                {qrSel.level === 'goat' && <Bt onClick={async () => {
                  if (qrSel.goatMonthlyUsed || qrBusy) return;
                  setQrBusy(true);
                  await updateDoc(doc(db, 'customers', qrSel.id), { goatMonthlyUsed: true });
                  await addDoc(collection(db, 'stampLogs'), { customerId: qrSel.id, customerName: qrSel.name, staffId: 'admin', staffName: 'Admin QR', branchId: 'admin', type: 'goat_monthly', timestamp: serverTimestamp() });
                  setQrSel({ ...qrSel, goatMonthlyUsed: true });
                  msg('GOAT aylık ücretsiz verildi!');
                  setQrBusy(false);
                }} disabled={qrSel.goatMonthlyUsed} color={COLORS.gold}>GOAT Aylık Ücretsiz</Bt>}
              </div>
            </C>}

            {/* Kategori seçimi */}
            {qrStep === 'cat' && <C style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>Müşteri ne aldı?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STAMP_CATEGORIES.map(c => (
                  <Bt key={c.id} onClick={() => { setQrCat(c.id); setQrStep('confirm'); }} sm>{c.name}</Bt>
                ))}
              </div>
              <div style={{ marginTop: 8 }}><Bt onClick={() => setQrStep(null)} color={COLORS.gray} sm>Geri</Bt></div>
            </C>}

            {/* Onay */}
            {qrStep === 'confirm' && <C style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 8 }}>Damga Onayı</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.fioreBeyaz }}>{qrSel.name}</div>
              <div style={{ fontSize: 12, color: COLORS.grayDark, marginBottom: 12 }}>{STAMP_CATEGORIES.find(c => c.id === qrCat)?.name} · Kart: {(qrSel.currentCard||0)+1}/7</div>
              <Bt onClick={async () => {
                if (qrBusy) return;
                setQrBusy(true);
                const nc = (qrSel.currentCard||0)+1, nt = (qrSel.totalStamps||0)+1;
                let nl = qrSel.level;
                if (nt >= 40 && qrSel.level !== 'goat') nl = 'goat';
                else if (nt >= 16 && qrSel.level === 'misafir') nl = 'mudavim';
                await updateDoc(doc(db, 'customers', qrSel.id), { currentCard: nc, totalStamps: nt, level: nl });
                await addDoc(collection(db, 'stampLogs'), { customerId: qrSel.id, customerName: qrSel.name, staffId: 'admin', staffName: 'Admin QR', branchId: 'admin', type: 'stamp', productCategory: qrCat, cardBefore: qrSel.currentCard||0, cardAfter: nc, timestamp: serverTimestamp() });
                // Referans bonus
                if (nt === 1 && qrSel.referredBy) {
                  try {
                    const refDoc = await getDoc(doc(db, 'customers', qrSel.referredBy));
                    if (refDoc.exists()) {
                      const rd = refDoc.data();
                      const rnc = (rd.currentCard||0)+1 > 7 ? rd.currentCard||0 : (rd.currentCard||0)+1;
                      const rnt = (rd.totalStamps||0)+1;
                      let rnl = rd.level;
                      if (rnt >= 40 && rd.level !== 'goat') rnl = 'goat';
                      else if (rnt >= 16 && rd.level === 'misafir') rnl = 'mudavim';
                      await updateDoc(doc(db, 'customers', qrSel.referredBy), { currentCard: rnc, totalStamps: rnt, level: rnl });
                      await addDoc(collection(db, 'stampLogs'), { customerId: qrSel.referredBy, customerName: rd.name, staffId: 'admin', staffName: 'Referans Bonus', branchId: 'admin', type: 'referral_bonus', cardAfter: rnc, timestamp: serverTimestamp() });
                    }
                  } catch(e) {}
                }
                setQrSel({ ...qrSel, currentCard: nc, totalStamps: nt, level: nl });
                msg(`Damga: ${qrSel.name} ${nc}/7`);
                setQrStep(null); setQrCat(null);
                setQrBusy(false);
              }} color={COLORS.green}>Onayla</Bt>
              <div style={{ marginTop: 8 }}><Bt onClick={() => { setQrStep('cat'); setQrCat(null); }} color={COLORS.gray} sm>Geri</Bt></div>
            </C>}

            <div onClick={() => { setQrSel(null); setQrStep(null); setQrCat(null); }} style={{ textAlign: 'center', fontSize: 13, color: COLORS.blue, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Yeni QR Okut</div>
          </div>
        )}
      </div>}

      {/* ===== MÜŞTERİLER ===== */}
      {tab === 'cust' && <div style={{ padding: '14px 16px' }}>
        <div style={{ background: COLORS.cardBg, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${COLORS.divider}`, marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.gray} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="İsim veya telefon ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent', color: COLORS.fioreBeyaz }} />
        </div>
        {filtered.map(c => <C key={c.id} style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: editingCust === c.id ? 10 : 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.level === 'goat' ? COLORS.goldBg : COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange, border: `2px solid ${c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange}30` }}>{c.name?.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 14, fontWeight: 600, color: COLORS.fioreBeyaz }}>{c.name}</span><B text={c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange} /></div>
              <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 2 }}>Kart: {c.currentCard || 0}/7 · Toplam: {c.totalStamps || 0}</div>
            </div>
            <div onClick={() => setEditingCust(editingCust === c.id ? null : c.id)} style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, cursor: 'pointer', background: COLORS.blueBg, padding: '5px 10px', borderRadius: 8 }}>{editingCust === c.id ? '✕' : '✎'}</div>
          </div>
          {editingCust === c.id && <div style={{ paddingTop: 10, borderTop: `1px solid ${COLORS.divider}` }}>
            {/* Müşteri Detayları */}
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.grayDark, marginBottom: 8 }}>Müşteri Bilgileri</div>
            <div style={{ background: COLORS.warmGray, borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
              {[['Telefon', c.phone || '—'], ['E-posta', c.email || '—'], ['Referans Kodu', c.referralCode || '—'], ['Kayıt', c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : '—']].map(([l, v], i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? `1px solid ${COLORS.divider}` : 'none' }}>
                  <span style={{ fontSize: 11, color: COLORS.gray }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.fioreBeyaz }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.grayDark, marginBottom: 8 }}>Damga Düzenleme</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><Bt onClick={() => adjustStamp(c.id, 1)} color={COLORS.green} sm disabled={(c.currentCard || 0) >= 7}>+ Damga</Bt></div>
              <div style={{ flex: 1 }}><Bt onClick={() => adjustStamp(c.id, -1)} color={COLORS.red} sm disabled={(c.currentCard || 0) <= 0 || (c.totalStamps || 0) <= 0}>− Damga</Bt></div>
            </div>
            <Bt onClick={() => { resetCard(c.id); setEditingCust(null); }} color={COLORS.gray} sm>Kartı Sıfırla (0/7)</Bt>
            {c.level === 'goat' && <div style={{ marginTop: 6 }}><Bt onClick={async () => { await updateDoc(doc(db, 'customers', c.id), { goatMonthlyUsed: false }); setCustomers(p => p.map(x => x.id === c.id ? { ...x, goatMonthlyUsed: false } : x)); msg('GOAT aylık sıfırlandı'); }} color={COLORS.gold} sm>GOAT Aylık Sıfırla</Bt></div>}
            <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.divider}`, paddingTop: 10 }}>
              <Bt onClick={async () => { if (!confirm(`${c.name} silinsin mi? Bu işlem geri alınamaz!`)) return; await deleteDoc(doc(db, 'customers', c.id)); setCustomers(p => p.filter(x => x.id !== c.id)); setEditingCust(null); msg(`${c.name} silindi`); }} color={COLORS.red} sm>Müşteriyi Sil</Bt>
            </div>
          </div>}
        </C>)}
      </div>}

      {/* ===== PERSONEL ===== */}
      {tab === 'staff' && <div style={{ padding: '14px 16px' }}>
        {/* Yeni Personel */}
        <C style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>Yeni Personel Ekle</div>
          <Inp label="Ad Soyad" value={newStaff.name} onChange={v => setNewStaff(p => ({ ...p, name: v }))} placeholder="Elif Arslan" />
          <Inp label="Kullanıcı Adı" value={newStaff.username} onChange={v => setNewStaff(p => ({ ...p, username: v.toLowerCase().replace(/\s/g, '.') }))} placeholder="elif.arslan" />
          <Inp label="PIN (4 hane)" value={newStaff.pin} onChange={v => { if (/^\d{0,4}$/.test(v)) setNewStaff(p => ({ ...p, pin: v })); }} placeholder="1234" />
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Rol</div>
            <div style={{ display: 'flex', gap: 5 }}>{['Barista', 'Part-time', 'Müdür'].map(r => <div key={r} onClick={() => setNewStaff(p => ({ ...p, role: r }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newStaff.role === r ? COLORS.blue : COLORS.warmGray, color: newStaff.role === r ? COLORS.fioreBeyaz : COLORS.grayDark }}>{r}</div>)}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Şube</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{branchKeys.map(bid => <div key={bid} onClick={() => setNewStaff(p => ({ ...p, branch: bid }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newStaff.branch === bid ? COLORS.fioreOrange : COLORS.warmGray, color: newStaff.branch === bid ? COLORS.fioreBeyaz : COLORS.grayDark }}>{branches[bid]?.shortName || branches[bid]?.name}</div>)}</div>
          </div>
          <Bt onClick={async () => {
            if (!newStaff.name || !newStaff.username || newStaff.pin.length !== 4 || !newStaff.branch) { msg('Tüm alanları doldurun!'); return; }
            const hashedPin = await hashPin(newStaff.pin);
            const staffObj = { ...newStaff, pin: hashedPin, status: 'active', createdAt: serverTimestamp() };
            const ref = await addDoc(collection(db, 'staff'), staffObj);
            setStaffList(p => [...p, { id: ref.id, ...staffObj }]);
            setNewStaff({ name: '', username: '', pin: '', role: 'Barista', branch: '' });
            msg('Personel eklendi!');
          }} color={COLORS.green}>Personel Ekle</Bt>
        </C>

        {/* Mevcut personel */}
        {branchKeys.map(bid => <div key={bid} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>{branches[bid]?.name || branches[bid]?.shortName}</div>
          {staffList.filter(s => s.branch === bid).map(st => <C key={st.id} style={{ marginBottom: 8 }}>
            {editingStaff === st.id ? <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.blue, marginBottom: 10 }}>Düzenle: {st.name}</div>
              <Inp label="Kullanıcı Adı" value={editForm.username || ''} onChange={v => setEditForm(p => ({ ...p, username: v }))} />
              <Inp label="Yeni PIN (boş bırakırsan değişmez)" value={editForm.pin || ''} onChange={v => { if (/^\d{0,4}$/.test(v)) setEditForm(p => ({ ...p, pin: v })); }} />
              <div style={{ marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Rol</div><div style={{ display: 'flex', gap: 5 }}>{['Barista', 'Part-time', 'Müdür'].map(r => <div key={r} onClick={() => setEditForm(p => ({ ...p, role: r }))} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: editForm.role === r ? COLORS.blue : COLORS.warmGray, color: editForm.role === r ? COLORS.fioreBeyaz : COLORS.grayDark }}>{r}</div>)}</div></div>
              <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Şube</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{branchKeys.map(b => <div key={b} onClick={() => setEditForm(p => ({ ...p, branch: b }))} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: editForm.branch === b ? COLORS.fioreOrange : COLORS.warmGray, color: editForm.branch === b ? COLORS.fioreBeyaz : COLORS.grayDark }}>{branches[b]?.shortName || branches[b]?.name}</div>)}</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}><Bt onClick={async () => {
                  try {
                    const updates = { username: editForm.username, role: editForm.role, branch: editForm.branch };
                    // PIN değiştiyse hashle (4 haneli yeni PIN girildiyse)
                    if (editForm.pin && editForm.pin.length === 4 && /^\d{4}$/.test(editForm.pin)) {
                      updates.pin = await hashPin(editForm.pin);
                    }
                    await updateDoc(doc(db, 'staff', st.id), updates);
                    setStaffList(p => p.map(s => s.id === st.id ? { ...s, ...updates } : s));
                    setEditingStaff(null); msg('Güncellendi!');
                  } catch (e) { msg('Hata: ' + e.message); console.error(e); }
                }} color={COLORS.green} sm>Kaydet</Bt></div>
                <div style={{ flex: 1 }}><Bt onClick={() => setEditingStaff(null)} color={COLORS.gray} sm>İptal</Bt></div>
              </div>
            </div> : <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>{st.name}</div><div style={{ fontSize: 12, color: COLORS.blue }}>@{st.username} · {st.role}</div></div>
                <B text={st.status === 'active' ? 'Aktif' : 'Pasif'} color={st.status === 'active' ? COLORS.green : COLORS.gray} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.grayLight}` }}>
                <div style={{ fontSize: 12, color: COLORS.grayDark }}>PIN: <span style={{ fontWeight: 700, background: COLORS.warmGray, color: COLORS.fioreBeyaz, padding: '3px 10px', borderRadius: 6, letterSpacing: 3 }}>{st.pin.length > 4 ? '••••' : st.pin}</span></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span onClick={() => { setEditingStaff(st.id); setEditForm({ username: st.username, pin: '', role: st.role, branch: st.branch }); }} style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>✎</span>
                  <span onClick={async () => {
                    const newStatus = st.status === 'active' ? 'inactive' : 'active';
                    await updateDoc(doc(db, 'staff', st.id), { status: newStatus });
                    setStaffList(p => p.map(s => s.id === st.id ? { ...s, status: newStatus } : s));
                    msg(newStatus === 'active' ? '✓ Aktif edildi' : '✓ Pasif edildi');
                  }} style={{ fontSize: 11, color: st.status === 'active' ? COLORS.red : COLORS.green, fontWeight: 700, cursor: 'pointer' }}>{st.status === 'active' ? '■' : '▸'}</span>
                  <span onClick={async () => { if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return; await deleteDoc(doc(db, 'staff', st.id)); setStaffList(p => p.filter(s => s.id !== st.id)); msg('✓ Silindi'); }} style={{ fontSize: 11, color: COLORS.red, fontWeight: 700, cursor: 'pointer' }}>🗑️</span>
                </div>
              </div>
            </>}
          </C>)}
        </div>)}
      </div>}

      {/* ===== ŞUBE YÖNETİMİ ===== */}
      {tab === 'branch' && <div style={{ padding: '14px 16px' }}>
        <C style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>Yeni Şube Ekle</div>
          <Inp label="Şube Adı" value={newBranch.name} onChange={v => setNewBranch(p => ({ ...p, name: v }))} placeholder="CaffeDiFiore Yeni AVM" />
          <Inp label="Kısa Ad" value={newBranch.shortName} onChange={v => setNewBranch(p => ({ ...p, shortName: v }))} placeholder="Yeni AVM" />
          <Bt onClick={async () => {
            if (!newBranch.name || !newBranch.shortName) { msg('Ad ve kısa ad girin!'); return; }
            const brId = newBranch.shortName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            await setDoc(doc(db, 'branches', brId), { name: newBranch.name, shortName: newBranch.shortName, lat: null, lng: null });
            setBranches(p => ({ ...p, [brId]: { name: newBranch.name, shortName: newBranch.shortName, lat: null, lng: null } }));
            setNewBranch({ name: '', shortName: '' });
            msg('✓ Şube eklendi! GPS kaydetmek için şubeye gidin.');
          }} color={COLORS.green}>✓ Şube Ekle</Bt>
        </C>

        {branchKeys.map(bid => {
          const br = branches[bid];
          const brStaff = staffList.filter(s => s.branch === bid);
          const hasCoords = br.lat && br.lng;
          return <C key={bid} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: COLORS.fioreBeyaz }}>{br.name || br.shortName}</div>
                <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 3 }}>{brStaff.length} personel: {brStaff.map(s => s.name).join(', ') || '-'}</div></div>
              <B text={hasCoords ? 'GPS aktif' : 'GPS yok'} color={hasCoords ? COLORS.green : COLORS.red} />
            </div>
            {hasCoords && <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>{br.lat.toFixed(6)}, {br.lng.toFixed(6)}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <div style={{ flex: 1 }}><Bt onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    await updateDoc(doc(db, 'branches', bid), { lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setBranches(p => ({ ...p, [bid]: { ...p[bid], lat: pos.coords.latitude, lng: pos.coords.longitude } }));
                    msg(`✓ ${br.shortName || br.name} konumu kaydedildi!`);
                  },
                  () => msg('Konum alınamadı!'),
                  { enableHighAccuracy: true }
                );
              }} color={COLORS.blue} sm>Konum {hasCoords ? 'Güncelle' : 'Kaydet'}</Bt></div>
              <div style={{ flex: 1 }}><Bt onClick={async () => {
                if (!confirm(`${br.name} şubesini silmek istediğinize emin misiniz?`)) return;
                await deleteDoc(doc(db, 'branches', bid));
                setBranches(p => { const n = { ...p }; delete n[bid]; return n; });
                msg('✓ Şube silindi');
              }} color={COLORS.red} sm>🗑️ Sil</Bt></div>
            </div>
          </C>;
        })}
      </div>}

      {/* ===== KAMPANYALAR ===== */}
      {tab === 'camp' && <div style={{ padding: '14px 16px' }}>
        <C style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>Yeni Kampanya</div>
          <Inp label="Başlık" value={newCamp.title} onChange={v => setNewCamp(p => ({ ...p, title: v }))} placeholder="Hafta Sonu %20 İndirim" />
          <Inp label="Açıklama" value={newCamp.desc} onChange={v => setNewCamp(p => ({ ...p, desc: v }))} placeholder="Kampanya detayı..." />
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Hedef</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{[['all', 'Tüm Üyeler'], ['goat', 'GOAT'], ['mudavim', 'Müdavim'], ['misafir', 'Yeni']].map(([v, l]) => <div key={v} onClick={() => setNewCamp(p => ({ ...p, target: v }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newCamp.target === v ? COLORS.fioreOrange : COLORS.warmGray, color: newCamp.target === v ? COLORS.fioreBeyaz : COLORS.grayDark }}>{l}</div>)}</div></div>
          <Bt onClick={async () => {
            if (!newCamp.title.trim()) { msg('Başlık girin!'); return; }
            const ref = await addDoc(collection(db, 'campaigns'), { title: newCamp.title.trim(), description: newCamp.desc.trim(), target: newCamp.target, active: true, createdAt: serverTimestamp() });
            setCampaigns(p => [{ id: ref.id, title: newCamp.title.trim(), description: newCamp.desc.trim(), target: newCamp.target, active: true, createdAt: { seconds: Date.now() / 1000 } }, ...p]);
            setNewCamp({ title: '', desc: '', target: 'all' }); msg('✓ Yayınlandı!');
          }} color={COLORS.green}>Yayınla</Bt>
        </C>
        {campaigns.filter(c => c.active).length > 0 && <><div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 8 }}>Aktif</div>{campaigns.filter(c => c.active).map(c => <C key={c.id} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>{c.title}</div>{c.description && <div style={{ fontSize: 12, color: COLORS.grayDark, marginTop: 3 }}>{c.description}</div>}</div><B text="AKTİF" color={COLORS.green} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}><Bt onClick={async () => { try { await updateDoc(doc(db, 'campaigns', c.id), { active: false }); setCampaigns(p => p.map(x => x.id === c.id ? { ...x, active: false } : x)); msg('Durduruldu'); } catch(e) { msg('Hata: ' + e.message); } }} color={COLORS.gray} sm>Durdur</Bt></div>
            <div style={{ flex: 1 }}><Bt onClick={async () => { try { await deleteDoc(doc(db, 'campaigns', c.id)); setCampaigns(p => p.filter(x => x.id !== c.id)); msg('Silindi'); } catch(e) { msg('Silme hatası: ' + e.message); } }} color={COLORS.red} sm>Sil</Bt></div>
          </div>
        </C>)}</>}
        {campaigns.filter(c => !c.active).length > 0 && <><div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 8, marginTop: 14 }}>Geçmiş</div>{campaigns.filter(c => !c.active).map(c => <C key={c.id} style={{ marginBottom: 6, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreBeyaz }}>{c.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <B text="Bitti" color={COLORS.gray} />
              <div onClick={async () => { try { await deleteDoc(doc(db, 'campaigns', c.id)); setCampaigns(p => p.filter(x => x.id !== c.id)); msg('Silindi'); } catch(e) { msg('Hata: ' + e.message); } }} style={{ background: COLORS.red, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer' }}>Sil</div>
            </div>
          </div>
        </C>)}</>}
      </div>}

      {/* ===== MENÜ YÖNETİMİ ===== */}
      {tab === 'menu' && <div style={{ padding: '14px 16px' }}>
        {/* Bardak boyutları */}
        <C style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingSizes ? 12 : 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>Bardak Boyutları</div>
            {!editingSizes ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: COLORS.grayDark }}>Sıcak: {sizes.hotSmall}/{sizes.hotLarge} · Soğuk: {sizes.coldSize}</span>
                <span onClick={() => { setEditingSizes(true); setSizesForm({ ...sizes }); }} style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>✎</span>
              </div>
            ) : null}
          </div>
          {editingSizes && <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.fioreOrange, marginBottom: 8 }}>Sıcak İçecekler</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><Inp label="Küçük Boy" value={sizesForm.hotSmall || ''} onChange={v => setSizesForm(p => ({ ...p, hotSmall: v }))} placeholder="14oz" /></div>
              <div style={{ flex: 1 }}><Inp label="Büyük Boy" value={sizesForm.hotLarge || ''} onChange={v => setSizesForm(p => ({ ...p, hotLarge: v }))} placeholder="16oz" /></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.blue, marginBottom: 8 }}>Soğuk İçecekler</div>
            <Inp label="Boy" value={sizesForm.coldSize || ''} onChange={v => setSizesForm(p => ({ ...p, coldSize: v }))} placeholder="16oz" />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><Bt onClick={async () => {
                await setDoc(doc(db, 'settings', 'sizes'), sizesForm);
                setSizes(sizesForm);
                setEditingSizes(false);
                msg('✓ Boyutlar güncellendi!');
              }} color={COLORS.green} sm>Kaydet</Bt></div>
              <div style={{ flex: 1 }}><Bt onClick={() => setEditingSizes(false)} color={COLORS.gray} sm>İptal</Bt></div>
            </div>
          </div>}
        </C>

        {/* Yeni ürün ekle */}
        <C style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 12 }}>Yeni Ürün Ekle</div>
          <Inp label="Ürün Adı" value={newMenu.name} onChange={v => setNewMenu(p => ({ ...p, name: v }))} placeholder="Caramel Latte" />
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Kategori</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {getCategories(menuItems).map(cat => (
                <div key={cat.name} onClick={() => setNewMenu(p => ({ ...p, category: cat.name, categoryIcon: cat.icon, type: cat.type }))} style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: newMenu.category === cat.name ? COLORS.fioreOrange : COLORS.warmGray, color: newMenu.category === cat.name ? COLORS.fioreBeyaz : COLORS.grayDark }}>{cat.icon} {cat.name}</div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Fiyat Tipi</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[['dual', `${sizes.hotSmall} / ${sizes.hotLarge}`], ['single', `Tek Boyut (${sizes.coldSize})`], ['none', 'Boyutsuz']].map(([v, l]) => (
                <div key={v} onClick={() => setNewMenu(p => ({ ...p, priceType: v }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newMenu.priceType === v ? COLORS.fioreOrange : COLORS.warmGray, color: newMenu.priceType === v ? COLORS.fioreBeyaz : COLORS.grayDark }}>{l}</div>
              ))}
            </div>
          </div>
          {newMenu.priceType === 'dual' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><Inp label={sizes.hotSmall + ' Fiyat (₺)'} value={newMenu.price14oz} onChange={v => setNewMenu(p => ({ ...p, price14oz: v }))} placeholder="160" type="number" /></div>
              <div style={{ flex: 1 }}><Inp label={sizes.hotLarge + ' Fiyat (₺)'} value={newMenu.price16oz} onChange={v => setNewMenu(p => ({ ...p, price16oz: v }))} placeholder="170" type="number" /></div>
            </div>
          )}
          {newMenu.priceType === 'single' && (
            <div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Boyut Etiketi</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {[sizes.hotSmall, sizes.hotLarge, sizes.coldSize].filter((v, i, a) => a.indexOf(v) === i).map(s => (
                    <div key={s} onClick={() => setNewMenu(p => ({ ...p, sizeLabel: s }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newMenu.sizeLabel === s ? COLORS.blue : COLORS.warmGray, color: newMenu.sizeLabel === s ? COLORS.fioreBeyaz : COLORS.grayDark }}>{s}</div>
                  ))}
                  <input placeholder="Özel boy..." value={![sizes.hotSmall, sizes.hotLarge, sizes.coldSize].includes(newMenu.sizeLabel) ? newMenu.sizeLabel : ''} onChange={e => setNewMenu(p => ({ ...p, sizeLabel: e.target.value }))} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, border: `1.5px solid ${COLORS.grayLight}`, width: 90, outline: 'none' }} />
                </div>
              </div>
              <Inp label={(newMenu.sizeLabel || 'Tek Boyut') + ' Fiyat (₺)'} value={newMenu.price16oz} onChange={v => setNewMenu(p => ({ ...p, price16oz: v }))} placeholder="185" type="number" />
            </div>
          )}
          {newMenu.priceType === 'none' && (
            <Inp label="Fiyat (₺)" value={newMenu.price} onChange={v => setNewMenu(p => ({ ...p, price: v }))} placeholder="80" type="number" />
          )}
          <Bt onClick={async () => {
            if (!newMenu.name || !newMenu.category) { msg('Ad ve kategori girin!'); return; }
            const id = `${newMenu.category}__${newMenu.name}`.replace(/[\/\s#]/g, '_');
            const pt = newMenu.priceType;
            const data = {
              name: newMenu.name, category: newMenu.category, categoryIcon: newMenu.categoryIcon, type: newMenu.type,
              price14oz: pt === 'dual' ? Number(newMenu.price14oz) || 0 : pt === 'none' ? Number(newMenu.price) || 0 : 0,
              price16oz: pt === 'dual' ? Number(newMenu.price16oz) || 0 : pt === 'single' ? Number(newMenu.price16oz) || 0 : 0,
              singleSize: pt === 'none', sizeLabel: pt === 'single' ? newMenu.sizeLabel : '', isGoat: false, stampEligible: true, note: '', order: menuItems.length, active: true,
            };
            await setDoc(doc(db, 'menuItems', id), data);
            setMenuItems(p => [...p, { id, ...data }]);
            setNewMenu({ name: '', category: '', price14oz: '', price16oz: '', price: '', type: 'hot', categoryIcon: '', priceType: 'dual', sizeLabel: '' });
            msg('✓ Ürün eklendi!');
          }} color={COLORS.green}>✓ Ürün Ekle</Bt>
        </C>

        {/* Menü listesi — kategoriye göre */}
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>Menü ({menuItems.filter(m => m.active).length} ürün)</div>
        {groupByCategory(menuItems).map(cat => (
          <div key={cat.category} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange, marginBottom: 6 }}>{cat.icon} {cat.category}</div>
            {cat.items.map(item => {
              const isEd = editingMenuItem === item.id;
              return <div key={item.id} style={{ background: COLORS.cardBg, borderRadius: 12, padding: '10px 14px', marginBottom: 4 }}>
                {isEd ? (
                  <div>
                    <Inp label="Ürün Adı" value={menuEditForm.name || ''} onChange={v => setMenuEditForm(p => ({ ...p, name: v }))} />
                    {item.singleSize ? (
                      <Inp label="Fiyat (₺)" value={menuEditForm.price14oz || ''} onChange={v => setMenuEditForm(p => ({ ...p, price14oz: v }))} type="number" />
                    ) : item.price14oz && item.price16oz ? (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}><Inp label={sizes.hotSmall + ' ₺'} value={menuEditForm.price14oz || ''} onChange={v => setMenuEditForm(p => ({ ...p, price14oz: v }))} type="number" /></div>
                        <div style={{ flex: 1 }}><Inp label={sizes.hotLarge + ' ₺'} value={menuEditForm.price16oz || ''} onChange={v => setMenuEditForm(p => ({ ...p, price16oz: v }))} type="number" /></div>
                      </div>
                    ) : (
                      <Inp label={sizes.coldSize + ' ₺'} value={menuEditForm.price16oz || menuEditForm.price14oz || ''} onChange={v => setMenuEditForm(p => item.price16oz ? ({ ...p, price16oz: v }) : ({ ...p, price14oz: v }))} type="number" />
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}><Bt onClick={async () => {
                        const upd = { name: menuEditForm.name, price14oz: Number(menuEditForm.price14oz) || 0, price16oz: Number(menuEditForm.price16oz) || 0 };
                        await updateDoc(doc(db, 'menuItems', item.id), upd);
                        setMenuItems(p => p.map(x => x.id === item.id ? { ...x, ...upd } : x));
                        setEditingMenuItem(null); msg(`✓ ${menuEditForm.name} güncellendi!`);
                      }} color={COLORS.green} sm>Kaydet</Bt></div>
                      <div style={{ flex: 1 }}><Bt onClick={() => setEditingMenuItem(null)} color={COLORS.gray} sm>İptal</Bt></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreBeyaz }}>{item.name}</span>
                      {item.isGoat && <B text="#GOAT" color={COLORS.gold} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange }}>
                        {item.price14oz ? `₺${item.price14oz}` : ''}{item.price14oz && item.price16oz ? ' / ' : ''}{item.price16oz ? `₺${item.price16oz}` : ''}
                      </span>
                      <span onClick={() => { setEditingMenuItem(item.id); setMenuEditForm({ name: item.name, price14oz: String(item.price14oz || ''), price16oz: String(item.price16oz || '') }); }} style={{ fontSize: 11, color: COLORS.blue, cursor: 'pointer' }}>✎</span>
                      <span onClick={async () => {
                        await updateDoc(doc(db, 'menuItems', item.id), { active: false });
                        setMenuItems(p => p.map(x => x.id === item.id ? { ...x, active: false } : x));
                        msg(`${item.name} menüden çıkarıldı`);
                      }} style={{ fontSize: 11, color: COLORS.red, cursor: 'pointer' }}>🗑️</span>
                    </div>
                  </div>
                )}
              </div>;
            })}
          </div>
        ))}
      </div>}

      {/* ===== İŞLEM LOG ===== */}
      {tab === 'logs' && <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, color: COLORS.grayDark, marginBottom: 10, background: COLORS.warmGray, padding: '8px 12px', borderRadius: 10 }}>Tüm işlem geçmişi</div>
        {stampLogs.length === 0 ? <C style={{ textAlign: 'center', padding: 30 }}><div style={{ color: COLORS.gray }}>Henüz işlem yok</div></C> : stampLogs.map((l, i) => <div key={l.id || i} style={{ background: COLORS.cardBg, borderRadius: 14, padding: '12px 16px', marginBottom: 6, border: `1px solid ${COLORS.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreBeyaz }}>{l.customerName}</span><span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8 }}>{l.timestamp?.toDate?.()?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + l.timestamp?.toDate?.()?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) || ''}</span></div>
            <B text={l.type === 'stamp' ? 'DAMGA' : l.type === 'goat_monthly' ? 'GOAT' : l.type === 'admin_add' ? '+ADMIN' : l.type === 'admin_remove' ? '-ADMIN' : 'ÜCRETSİZ'} color={l.type === 'stamp' ? COLORS.fioreOrange : l.type === 'goat_monthly' ? COLORS.gold : l.type?.startsWith('admin') ? COLORS.purple : COLORS.green} />
          </div>
          <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 4 }}>{l.staffName} · {branches[l.branchId]?.shortName || l.branchId}{l.productCategory ? ` · ${STAMP_CATEGORIES.find(c => c.id === l.productCategory)?.name || l.productCategory}` : ''}</div>
        </div>)}
      </div>}
    </div>
  );
}
