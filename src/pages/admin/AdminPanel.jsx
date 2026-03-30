import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { COLORS, STAMP_CATEGORIES } from '../../config/constants.js';

const C = ({ children, style = {}, border }) => <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', border: border || 'none', ...style }}>{children}</div>;
const B = ({ text, color = COLORS.fioreOrange }) => <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.fioreBeyaz, background: color, padding: '3px 10px', borderRadius: 10 }}>{text}</span>;
const Bt = ({ children, color = COLORS.fioreOrange, onClick, sm, disabled }) => <div onClick={disabled ? undefined : onClick} style={{ background: disabled ? COLORS.grayLight : color, color: disabled ? COLORS.gray : COLORS.fioreBeyaz, borderRadius: 12, padding: sm ? '8px 12px' : '14px', textAlign: 'center', fontWeight: 700, fontSize: sm ? 12 : 14, cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', opacity: disabled ? 0.4 : 1 }}>{children}</div>;
const Inp = ({ label, value, onChange, placeholder, type = 'text' }) => <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>{label}</div><input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${COLORS.grayLight}`, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} /></div>;

const tabs = [
  { id: 'dash', label: 'Ana', icon: '📊' },
  { id: 'cust', label: 'Müşteri', icon: '👥' },
  { id: 'staff', label: 'Personel', icon: '👨‍🍳' },
  { id: 'branch', label: 'Şube', icon: '🏢' },
  { id: 'camp', label: 'Kampanya', icon: '📢' },
  { id: 'menu', label: 'Menü', icon: '📋' },
  { id: 'logs', label: 'Log', icon: '🕐' },
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
  const [newMenu, setNewMenu] = useState({ name: '', category: '', price14oz: '', price16oz: '', type: 'hot' });
  const [adminEdit, setAdminEdit] = useState(null);
  const [adminForm, setAdminForm] = useState({ username: '', password: '', phone: '' });
  const [editingCust, setEditingCust] = useState(null);

  const msg = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const load = async () => {
      const [custSnap, staffSnap, logSnap, brSnap, campSnap, menuSnap] = await Promise.all([
        getDocs(collection(db, 'customers')), getDocs(collection(db, 'staff')),
        getDocs(collection(db, 'stampLogs')), getDocs(collection(db, 'branches')),
        getDocs(collection(db, 'campaigns')), getDocs(collection(db, 'menu')),
      ]);
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
      setMenuItems(menuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    await addDoc(collection(db, 'stampLogs'), { customerId: custId, customerName: c.name, staffId: 'admin', staffName: 'Admin', branchId: 'admin', type: delta > 0 ? 'admin_add' : 'admin_remove', cardAfter: newCard, timestamp: serverTimestamp() });
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
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {toast && <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: COLORS.green, color: COLORS.fioreBeyaz, padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 340, textAlign: 'center' }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(180deg, #3D2B1F, #2A1810)', padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><img src="/icons/logo-header.png" alt="" style={{ height: 24 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 10, color: COLORS.fioreOrange, fontWeight: 800, letterSpacing: 2 }}>ADMİN PANELİ</div><div style={{ fontSize: 18, fontWeight: 800, color: COLORS.fioreBeyaz, marginTop: 2 }}>Merhaba Mikail</div></div>
          <div onClick={logout} style={{ fontSize: 11, color: COLORS.gray, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 8 }}>Çıkış</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, padding: '10px 12px', background: COLORS.fioreBeyaz, borderBottom: `2px solid ${COLORS.grayLight}`, overflowX: 'auto' }}>
        {tabs.map(t => <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: tab === t.id ? COLORS.fioreSiyah : COLORS.warmGray, color: tab === t.id ? COLORS.fioreBeyaz : COLORS.grayDark }}>{t.icon} {t.label}</div>)}
      </div>

      {/* ===== DASHBOARD ===== */}
      {tab === 'dash' && <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[['Üye', customers.length, '👥', COLORS.orangeGlow, COLORS.fioreOrange], ['Damga', stampLogs.filter(l => l.type === 'stamp').length, '☕', COLORS.blueBg, COLORS.blue], ['Ücretsiz', stampLogs.filter(l => l.type !== 'stamp' && l.type !== 'admin_add' && l.type !== 'admin_remove').length, '🎁', COLORS.greenBg, COLORS.green], ['GOAT', goatCount, '🐐', COLORS.goldBg, COLORS.gold]].map(([l, v, ic, bg, c]) => <C key={l}><div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 6 }}>{ic}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 11, color: COLORS.grayDark, fontWeight: 600 }}>{l}</div></C>)}
        </div>
        <C><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏆 En İyiler</div>
          {customers.slice(0, 5).map((c, i) => <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${COLORS.grayLight}` : 'none' }}><span style={{ fontSize: 16 }}>{c.level === 'goat' ? '🐐' : c.level === 'mudavim' ? '⭐' : '☕'}</span><div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{c.name} </span><B text={c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange} /></div><span style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange }}>{c.totalStamps || 0}</span></div>)}
        </C>
        {/* Admin Ayarları */}
        <C style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminEdit ? 12 : 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>⚙️ Admin Ayarları</div>
            {!adminEdit && <div onClick={async () => { const snap = await getDocs(collection(db, 'settings')); const ad = snap.docs.find(d => d.id === 'admin'); if (ad) { const d = ad.data(); setAdminForm({ username: d.username || '', password: d.password || '', phone: d.phone || '' }); setAdminEdit(true); } }} style={{ fontSize: 12, color: COLORS.blue, fontWeight: 700, cursor: 'pointer', background: COLORS.blueBg, padding: '5px 12px', borderRadius: 8 }}>✏️ Düzenle</div>}
          </div>
          {adminEdit && <div>
            <Inp label="Kullanıcı Adı" value={adminForm.username} onChange={v => setAdminForm(p => ({ ...p, username: v }))} />
            <Inp label="Şifre" value={adminForm.password} onChange={v => setAdminForm(p => ({ ...p, password: v }))} />
            <Inp label="Telefon" value={adminForm.phone} onChange={v => setAdminForm(p => ({ ...p, phone: v }))} placeholder="+905XXXXXXXXX" />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><Bt onClick={async () => { await updateDoc(doc(db, 'settings', 'admin'), adminForm); setAdminEdit(null); msg('✓ Admin güncellendi!'); }} color={COLORS.green} sm>Kaydet</Bt></div>
              <div style={{ flex: 1 }}><Bt onClick={() => setAdminEdit(null)} color={COLORS.gray} sm>İptal</Bt></div>
            </div>
          </div>}
        </C>
      </div>}

      {/* ===== MÜŞTERİLER ===== */}
      {tab === 'cust' && <div style={{ padding: '14px 16px' }}>
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${COLORS.grayLight}`, marginBottom: 10 }}>
          <span>🔍</span><input placeholder="İsim veya telefon ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }} />
        </div>
        {filtered.map(c => <C key={c.id} style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: editingCust === c.id ? 10 : 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.level === 'goat' ? COLORS.goldBg : COLORS.orangeGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange, border: `2px solid ${c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange}30` }}>{c.name?.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</span><B text={c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange} /></div>
              <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 2 }}>Kart: {c.currentCard || 0}/7 · Toplam: {c.totalStamps || 0}</div>
            </div>
            <div onClick={() => setEditingCust(editingCust === c.id ? null : c.id)} style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, cursor: 'pointer', background: COLORS.blueBg, padding: '5px 10px', borderRadius: 8 }}>{editingCust === c.id ? '✕' : '✏️'}</div>
          </div>
          {editingCust === c.id && <div style={{ paddingTop: 10, borderTop: `1px solid ${COLORS.grayLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Manuel Damga Düzenleme</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><Bt onClick={() => adjustStamp(c.id, 1)} color={COLORS.green} sm disabled={(c.currentCard || 0) >= 7}>+ Damga Ekle</Bt></div>
              <div style={{ flex: 1 }}><Bt onClick={() => adjustStamp(c.id, -1)} color={COLORS.red} sm disabled={(c.currentCard || 0) <= 0 || (c.totalStamps || 0) <= 0}>− Damga Çıkar</Bt></div>
            </div>
            <Bt onClick={() => { resetCard(c.id); setEditingCust(null); }} color={COLORS.gray} sm>🔄 Kartı Sıfırla (0/7)</Bt>
            {c.level === 'goat' && <div style={{ marginTop: 6 }}><Bt onClick={async () => { await updateDoc(doc(db, 'customers', c.id), { goatMonthlyUsed: false }); setCustomers(p => p.map(x => x.id === c.id ? { ...x, goatMonthlyUsed: false } : x)); msg('GOAT aylık sıfırlandı'); }} color={COLORS.gold} sm>🐐 GOAT Aylık Sıfırla</Bt></div>}
          </div>}
        </C>)}
      </div>}

      {/* ===== PERSONEL ===== */}
      {tab === 'staff' && <div style={{ padding: '14px 16px' }}>
        {/* Yeni Personel */}
        <C style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>➕ Yeni Personel Ekle</div>
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
            const ref = await addDoc(collection(db, 'staff'), { ...newStaff, status: 'active', createdAt: serverTimestamp() });
            setStaffList(p => [...p, { id: ref.id, ...newStaff, status: 'active' }]);
            setNewStaff({ name: '', username: '', pin: '', role: 'Barista', branch: '' });
            msg('✓ Personel eklendi!');
          }} color={COLORS.green}>✓ Personel Ekle</Bt>
        </C>

        {/* Mevcut personel */}
        {branchKeys.map(bid => <div key={bid} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏢 {branches[bid]?.name || branches[bid]?.shortName}</div>
          {staffList.filter(s => s.branch === bid).map(st => <C key={st.id} style={{ marginBottom: 8 }}>
            {editingStaff === st.id ? <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.blue, marginBottom: 10 }}>✏️ Düzenle: {st.name}</div>
              <Inp label="Kullanıcı Adı" value={editForm.username || ''} onChange={v => setEditForm(p => ({ ...p, username: v }))} />
              <Inp label="PIN" value={editForm.pin || ''} onChange={v => { if (/^\d{0,4}$/.test(v)) setEditForm(p => ({ ...p, pin: v })); }} />
              <div style={{ marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Rol</div><div style={{ display: 'flex', gap: 5 }}>{['Barista', 'Part-time', 'Müdür'].map(r => <div key={r} onClick={() => setEditForm(p => ({ ...p, role: r }))} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: editForm.role === r ? COLORS.blue : COLORS.warmGray, color: editForm.role === r ? COLORS.fioreBeyaz : COLORS.grayDark }}>{r}</div>)}</div></div>
              <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Şube</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{branchKeys.map(b => <div key={b} onClick={() => setEditForm(p => ({ ...p, branch: b }))} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: editForm.branch === b ? COLORS.fioreOrange : COLORS.warmGray, color: editForm.branch === b ? COLORS.fioreBeyaz : COLORS.grayDark }}>{branches[b]?.shortName || branches[b]?.name}</div>)}</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}><Bt onClick={async () => { await updateDoc(doc(db, 'staff', st.id), editForm); setStaffList(p => p.map(s => s.id === st.id ? { ...s, ...editForm } : s)); setEditingStaff(null); msg('✓ Güncellendi!'); }} color={COLORS.green} sm>Kaydet</Bt></div>
                <div style={{ flex: 1 }}><Bt onClick={() => setEditingStaff(null)} color={COLORS.gray} sm>İptal</Bt></div>
              </div>
            </div> : <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontSize: 14, fontWeight: 700 }}>{st.name}</div><div style={{ fontSize: 12, color: COLORS.blue }}>@{st.username} · {st.role}</div></div>
                <B text={st.status === 'active' ? 'Aktif' : 'Pasif'} color={st.status === 'active' ? COLORS.green : COLORS.gray} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.grayLight}` }}>
                <div style={{ fontSize: 12 }}>PIN: <span style={{ fontWeight: 800, background: COLORS.warmGray, padding: '3px 10px', borderRadius: 6, letterSpacing: 3 }}>{st.pin}</span></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span onClick={() => { setEditingStaff(st.id); setEditForm({ username: st.username, pin: st.pin, role: st.role, branch: st.branch }); }} style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, cursor: 'pointer' }}>✏️</span>
                  <span onClick={async () => {
                    const newStatus = st.status === 'active' ? 'inactive' : 'active';
                    await updateDoc(doc(db, 'staff', st.id), { status: newStatus });
                    setStaffList(p => p.map(s => s.id === st.id ? { ...s, status: newStatus } : s));
                    msg(newStatus === 'active' ? '✓ Aktif edildi' : '✓ Pasif edildi');
                  }} style={{ fontSize: 11, color: st.status === 'active' ? COLORS.red : COLORS.green, fontWeight: 700, cursor: 'pointer' }}>{st.status === 'active' ? '⏸️' : '▶️'}</span>
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
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>➕ Yeni Şube Ekle</div>
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
              <div><div style={{ fontSize: 15, fontWeight: 800 }}>{br.name || br.shortName}</div>
                <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 3 }}>{brStaff.length} personel: {brStaff.map(s => s.name).join(', ') || '-'}</div></div>
              <B text={hasCoords ? '📍 GPS var' : '❌ GPS yok'} color={hasCoords ? COLORS.green : COLORS.red} />
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
              }} color={COLORS.blue} sm>📍 Konum {hasCoords ? 'Güncelle' : 'Kaydet'}</Bt></div>
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
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>➕ Yeni Kampanya</div>
          <Inp label="Başlık" value={newCamp.title} onChange={v => setNewCamp(p => ({ ...p, title: v }))} placeholder="Hafta Sonu %20 İndirim" />
          <Inp label="Açıklama" value={newCamp.desc} onChange={v => setNewCamp(p => ({ ...p, desc: v }))} placeholder="Kampanya detayı..." />
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Hedef</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{[['all', 'Tüm Üyeler'], ['goat', 'GOAT'], ['mudavim', 'Müdavim'], ['misafir', 'Yeni']].map(([v, l]) => <div key={v} onClick={() => setNewCamp(p => ({ ...p, target: v }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newCamp.target === v ? COLORS.fioreOrange : COLORS.warmGray, color: newCamp.target === v ? COLORS.fioreBeyaz : COLORS.grayDark }}>{l}</div>)}</div></div>
          <Bt onClick={async () => {
            if (!newCamp.title.trim()) { msg('Başlık girin!'); return; }
            const ref = await addDoc(collection(db, 'campaigns'), { title: newCamp.title.trim(), description: newCamp.desc.trim(), target: newCamp.target, active: true, createdAt: serverTimestamp() });
            setCampaigns(p => [{ id: ref.id, title: newCamp.title.trim(), description: newCamp.desc.trim(), target: newCamp.target, active: true, createdAt: { seconds: Date.now() / 1000 } }, ...p]);
            setNewCamp({ title: '', desc: '', target: 'all' }); msg('✓ Yayınlandı!');
          }} color={COLORS.green}>🚀 Yayınla</Bt>
        </C>
        {campaigns.filter(c => c.active).length > 0 && <><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📢 Aktif</div>{campaigns.filter(c => c.active).map(c => <C key={c.id} style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</div>{c.description && <div style={{ fontSize: 12, color: COLORS.grayDark, marginTop: 3 }}>{c.description}</div>}</div><B text="AKTİF" color={COLORS.green} /></div><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><div style={{ flex: 1 }}><Bt onClick={async () => { await updateDoc(doc(db, 'campaigns', c.id), { active: false }); setCampaigns(p => p.map(x => x.id === c.id ? { ...x, active: false } : x)); msg('Durduruldu'); }} color={COLORS.gray} sm>Durdur</Bt></div><div style={{ flex: 1 }}><Bt onClick={async () => { await deleteDoc(doc(db, 'campaigns', c.id)); setCampaigns(p => p.filter(x => x.id !== c.id)); msg('Silindi'); }} color={COLORS.red} sm>Sil</Bt></div></div></C>)}</>}
        {campaigns.filter(c => !c.active).length > 0 && <><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, marginTop: 14 }}>📦 Geçmiş</div>{campaigns.filter(c => !c.active).map(c => <div key={c.id} style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}><div style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</div><B text="Bitti" color={COLORS.gray} /></div>)}</>}
      </div>}

      {/* ===== MENÜ YÖNETİMİ ===== */}
      {tab === 'menu' && <div style={{ padding: '14px 16px' }}>
        <C style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>➕ Yeni Ürün Ekle</div>
          <Inp label="Ürün Adı" value={newMenu.name} onChange={v => setNewMenu(p => ({ ...p, name: v }))} placeholder="Caramel Latte" />
          <Inp label="Kategori" value={newMenu.category} onChange={v => setNewMenu(p => ({ ...p, category: v }))} placeholder="Espresso & More" />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><Inp label="14oz Fiyat (₺)" value={newMenu.price14oz} onChange={v => setNewMenu(p => ({ ...p, price14oz: v }))} placeholder="160" type="number" /></div>
            <div style={{ flex: 1 }}><Inp label="16oz Fiyat (₺)" value={newMenu.price16oz} onChange={v => setNewMenu(p => ({ ...p, price16oz: v }))} placeholder="170" type="number" /></div>
          </div>
          <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Tür</div><div style={{ display: 'flex', gap: 5 }}>{[['hot', '☕ Sıcak'], ['cold', '🧊 Soğuk'], ['extra', '➕ Ekstra']].map(([v, l]) => <div key={v} onClick={() => setNewMenu(p => ({ ...p, type: v }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newMenu.type === v ? COLORS.fioreOrange : COLORS.warmGray, color: newMenu.type === v ? COLORS.fioreBeyaz : COLORS.grayDark }}>{l}</div>)}</div></div>
          <Bt onClick={async () => {
            if (!newMenu.name || !newMenu.category) { msg('Ad ve kategori girin!'); return; }
            const data = { name: newMenu.name, category: newMenu.category, type: newMenu.type, price14oz: Number(newMenu.price14oz) || 0, price16oz: Number(newMenu.price16oz) || 0, active: true, createdAt: serverTimestamp() };
            const ref = await addDoc(collection(db, 'menu'), data);
            setMenuItems(p => [...p, { id: ref.id, ...data }]);
            setNewMenu({ name: '', category: '', price14oz: '', price16oz: '', type: 'hot' });
            msg('✓ Ürün eklendi!');
          }} color={COLORS.green}>✓ Ürün Ekle</Bt>
        </C>

        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📋 Menü ({menuItems.length} ürün)</div>
        <div style={{ fontSize: 11, color: COLORS.grayDark, marginBottom: 10, background: COLORS.warmGray, padding: '8px 12px', borderRadius: 10 }}>ℹ️ Sabit menü kodda tanımlı. Buradan eklenen ürünler ekstra olarak gösterilir. Fiyat güncellemeleri için mevcut ürünleri buraya ekleyip eski listeden çıkaracağız.</div>
        {menuItems.map(m => <div key={m.id} style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '12px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div><div style={{ fontSize: 10, color: COLORS.gray }}>{m.category} · {m.type === 'hot' ? '☕' : m.type === 'cold' ? '🧊' : '➕'}</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange }}>{m.price14oz ? `₺${m.price14oz}` : ''}{m.price14oz && m.price16oz ? ' / ' : ''}{m.price16oz ? `₺${m.price16oz}` : ''}</span>
            <span onClick={async () => { await deleteDoc(doc(db, 'menu', m.id)); setMenuItems(p => p.filter(x => x.id !== m.id)); msg('Silindi'); }} style={{ fontSize: 14, cursor: 'pointer' }}>🗑️</span>
          </div>
        </div>)}
      </div>}

      {/* ===== İŞLEM LOG ===== */}
      {tab === 'logs' && <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, color: COLORS.grayDark, marginBottom: 10, background: COLORS.warmGray, padding: '8px 12px', borderRadius: 10 }}>ℹ️ Tüm işlem geçmişi</div>
        {stampLogs.length === 0 ? <C style={{ textAlign: 'center', padding: 30 }}><div style={{ color: COLORS.gray }}>Henüz işlem yok</div></C> : stampLogs.map((l, i) => <div key={l.id || i} style={{ background: COLORS.fioreBeyaz, borderRadius: 14, padding: '12px 16px', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={{ fontSize: 14, fontWeight: 700 }}>{l.customerName}</span><span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8 }}>{l.timestamp?.toDate?.()?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + l.timestamp?.toDate?.()?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) || ''}</span></div>
            <B text={l.type === 'stamp' ? 'DAMGA' : l.type === 'goat_monthly' ? 'GOAT' : l.type === 'admin_add' ? '+ADMIN' : l.type === 'admin_remove' ? '-ADMIN' : 'ÜCRETSİZ'} color={l.type === 'stamp' ? COLORS.fioreOrange : l.type === 'goat_monthly' ? COLORS.gold : l.type?.startsWith('admin') ? COLORS.purple : COLORS.green} />
          </div>
          <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 4 }}>{l.staffName} · {branches[l.branchId]?.shortName || l.branchId}{l.productCategory ? ` · ${STAMP_CATEGORIES.find(c => c.id === l.productCategory)?.name || l.productCategory}` : ''}</div>
        </div>)}
      </div>}
    </div>
  );
}
