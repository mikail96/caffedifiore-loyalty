import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { COLORS, STAMP_CATEGORIES } from '../../config/constants.js';

const Card = ({ children, style = {}, border }) => <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', border: border || 'none', ...style }}>{children}</div>;
const Badge = ({ text, color = COLORS.fioreOrange }) => <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.fioreBeyaz, background: color, padding: '3px 10px', borderRadius: 10 }}>{text}</span>;
const Btn = ({ children, color = COLORS.fioreOrange, onClick, sm }) => <div onClick={onClick} style={{ background: color, color: COLORS.fioreBeyaz, borderRadius: 12, padding: sm ? '8px 12px' : '14px', textAlign: 'center', fontWeight: 700, fontSize: sm ? 12 : 14, cursor: 'pointer', width: '100%' }}>{children}</div>;

const tabs = [
  { id: 'dash', label: 'Dashboard', icon: '📊' },
  { id: 'cust', label: 'Müşteriler', icon: '👥' },
  { id: 'staff', label: 'Personel', icon: '👨‍🍳' },
  { id: 'camp', label: 'Kampanya', icon: '📢' },
  { id: 'logs', label: 'İşlem Log', icon: '📋' },
];

export default function AdminPanel() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('dash');
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [stampLogs, setStampLogs] = useState([]);
  const [branches, setBranches] = useState({});
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [newCamp, setNewCamp] = useState({ title: '', desc: '', target: 'all' });

  const msg = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const load = async () => {
      const [custSnap, staffSnap, logSnap, brSnap, campSnap] = await Promise.all([
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'staff')),
        getDocs(collection(db, 'stampLogs')),
        getDocs(collection(db, 'branches')),
        getDocs(collection(db, 'campaigns')),
      ]);
      const cList = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const order = { goat: 0, mudavim: 1, misafir: 2 };
      cList.sort((a, b) => (order[a.level] || 2) - (order[b.level] || 2) || (b.totalStamps || 0) - (a.totalStamps || 0));
      setCustomers(cList);
      setStaffList(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const logList = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      logList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setStampLogs(logList);
      const brMap = {};
      brSnap.docs.forEach(d => { brMap[d.id] = d.data(); });
      setBranches(brMap);
      const campList = campSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      campList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCampaigns(campList);
    };
    load();
  }, []);

  const saveStaffEdit = async () => {
    if (!editingStaff) return;
    try {
      await updateDoc(doc(db, 'staff', editingStaff), {
        username: editForm.username,
        pin: editForm.pin,
        role: editForm.role,
        branch: editForm.branch,
      });
      setStaffList(p => p.map(s => s.id === editingStaff ? { ...s, ...editForm } : s));
      setEditingStaff(null);
      msg('✓ Personel güncellendi!');
    } catch (e) { msg('Hata!'); }
  };

  const goatCount = customers.filter(c => c.level === 'goat').length;
  const mudavimCount = customers.filter(c => c.level === 'mudavim').length;
  const stampCount = stampLogs.filter(l => l.type === 'stamp').length;
  const freeCount = stampLogs.filter(l => l.type !== 'stamp').length;
  const filtered = search ? customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)) : customers;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {toast && <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', background: COLORS.green, color: COLORS.fioreBeyaz, padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>{toast}</div>}

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #3D2B1F, #2A1810)', padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><img src="/icons/logo-header.png" alt="" style={{ height: 24 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.fioreOrange, fontWeight: 800, letterSpacing: 2 }}>ADMİN PANELİ</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.fioreBeyaz, marginTop: 2 }}>Merhaba Mikail</div>
          </div>
          <div onClick={logout} style={{ fontSize: 11, color: COLORS.gray, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 8 }}>Çıkış</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 16px', background: COLORS.fioreBeyaz, borderBottom: `2px solid ${COLORS.grayLight}`, overflowX: 'auto' }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
            background: tab === t.id ? COLORS.fioreSiyah : COLORS.warmGray,
            color: tab === t.id ? COLORS.fioreBeyaz : COLORS.grayDark,
          }}>{t.icon} {t.label}</div>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 'dash' && <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            ['Toplam Üye', customers.length, '👥', COLORS.orangeGlow, COLORS.fioreOrange],
            ['Damga', stampCount, '☕', COLORS.blueBg, COLORS.blue],
            ['Ücretsiz', freeCount, '🎁', COLORS.greenBg, COLORS.green],
            ['GOAT Üyeler', goatCount, '🐐', COLORS.goldBg, COLORS.gold],
          ].map(([l, v, ic, bg, c]) => (
            <Card key={l}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 6 }}>{ic}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: COLORS.grayDark, fontWeight: 600 }}>{l}</div>
            </Card>
          ))}
        </div>

        {/* Şubeler */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏢 Şubeler</div>
          {Object.entries(branches).map(([id, br]) => {
            const brStaff = staffList.filter(s => s.branch === id);
            const hasCoords = br.lat && br.lng;
            return (
              <div key={id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.grayLight}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{br.name || br.shortName}</div>
                    <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 3 }}>
                      {brStaff.map(s => s.name).join(', ') || 'Personel yok'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: hasCoords ? COLORS.greenBg : 'rgba(239,68,68,0.06)',
                    color: hasCoords ? COLORS.green : COLORS.red,
                    border: `1px solid ${hasCoords ? COLORS.green : COLORS.red}30`,
                  }}>
                    {hasCoords ? '📍 Konum var' : '❌ Konum yok'}
                  </div>
                </div>
                {hasCoords && (
                  <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>
                    {br.lat.toFixed(6)}, {br.lng.toFixed(6)}
                  </div>
                )}
                <div
                  onClick={async () => {
                    if (!navigator.geolocation) { msg('Tarayıcı konum desteklemiyor!'); return; }
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          await updateDoc(doc(db, 'branches', id), {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                          });
                          setBranches(p => ({ ...p, [id]: { ...p[id], lat: pos.coords.latitude, lng: pos.coords.longitude } }));
                          msg(`✓ ${br.shortName || br.name} konumu kaydedildi!`);
                        } catch (e) { msg('Kayıt hatası!'); }
                      },
                      (err) => { msg('Konum alınamadı! İzin verin.'); },
                      { enableHighAccuracy: true }
                    );
                  }}
                  style={{
                    marginTop: 8, background: COLORS.blue, color: COLORS.fioreBeyaz,
                    borderRadius: 10, padding: '10px', textAlign: 'center',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  📍 {hasCoords ? 'Konumu Güncelle' : 'Şu An Buradayım — Konum Kaydet'}
                </div>
              </div>
            );
          })}
        </Card>

        {/* Top müşteriler */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏆 GOAT {'>'} Müdavim {'>'} Misafir</div>
          {customers.slice(0, 8).map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? `1px solid ${COLORS.grayLight}` : 'none' }}>
              <span style={{ fontSize: 16 }}>{c.level === 'goat' ? '🐐' : c.level === 'mudavim' ? '⭐' : '☕'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name} </span>
                <Badge text={c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={c.level === 'goat' ? COLORS.gold : c.level === 'mudavim' ? COLORS.fioreOrange : COLORS.fioreOrange} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.fioreOrange }}>{c.totalStamps || 0}</span>
            </div>
          ))}
        </Card>
      </div>}

      {/* MÜŞTERİLER */}
      {tab === 'cust' && <div style={{ padding: '14px 16px' }}>
        <div style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${COLORS.grayLight}`, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input placeholder="İsim veya telefon ile ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }} />
        </div>
        {filtered.map(c => (
          <Card key={c.id} style={{ marginBottom: 8, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.level === 'goat' ? COLORS.goldBg : c.level === 'mudavim' ? COLORS.orangeGlow : COLORS.grayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: c.level === 'goat' ? COLORS.gold : COLORS.fioreOrange, border: `2px solid ${c.level === 'goat' ? COLORS.gold : c.level === 'mudavim' ? COLORS.fioreOrange : COLORS.fioreOrange}30` }}>
                {c.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</span>
                  <Badge text={c.level === 'goat' ? 'GOAT' : c.level === 'mudavim' ? 'MÜDAVİM' : 'MİSAFİR'} color={c.level === 'goat' ? COLORS.gold : c.level === 'mudavim' ? COLORS.fioreOrange : COLORS.fioreOrange} />
                </div>
                <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 3 }}>
                  Kart: {c.currentCard || 0}/7 · Toplam: {c.totalStamps || 0} damga
                </div>
                {c.level === 'goat' && (
                  <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700, marginTop: 2 }}>
                    GOAT Aylık: {c.goatMonthlyUsed ? 'Kullanıldı' : 'Kullanılmadı'}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.fioreOrange }}>{c.totalStamps || 0}</div>
                <div style={{ fontSize: 9, color: COLORS.gray }}>damga</div>
              </div>
            </div>
          </Card>
        ))}
      </div>}

      {/* PERSONEL */}
      {tab === 'staff' && <div style={{ padding: '14px 16px' }}>
        {Object.entries(branches).map(([brId, br]) => (
          <div key={brId} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              🏢 {br.name || br.shortName}
            </div>
            {staffList.filter(s => s.branch === brId).map(st => (
              <Card key={st.id} style={{ marginBottom: 8 }}>
                {editingStaff === st.id ? (
                  // Düzenleme modu
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.blue, marginBottom: 10 }}>✏️ Düzenle: {st.name}</div>
                    {[
                      ['Kullanıcı Adı', 'username'],
                      ['PIN', 'pin'],
                    ].map(([label, key]) => (
                      <div key={key} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>{label}</div>
                        <input value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${COLORS.grayLight}`, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Rol</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['Barista', 'Part-time', 'Müdür'].map(r => (
                          <div key={r} onClick={() => setEditForm(p => ({ ...p, role: r }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: editForm.role === r ? COLORS.blue : COLORS.warmGray, color: editForm.role === r ? COLORS.fioreBeyaz : COLORS.grayDark }}>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Şube</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {Object.entries(branches).map(([bid, b]) => (
                          <div key={bid} onClick={() => setEditForm(p => ({ ...p, branch: bid }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: editForm.branch === bid ? COLORS.fioreOrange : COLORS.warmGray, color: editForm.branch === bid ? COLORS.fioreBeyaz : COLORS.grayDark }}>
                            {b.shortName || b.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}><Btn onClick={saveStaffEdit} color={COLORS.green} sm>✓ Kaydet</Btn></div>
                      <div style={{ flex: 1 }}><Btn onClick={() => setEditingStaff(null)} color={COLORS.gray} sm>İptal</Btn></div>
                    </div>
                  </div>
                ) : (
                  // Görüntüleme modu
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{st.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.blue, fontWeight: 600 }}>@{st.username}</div>
                        <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 2 }}>{st.role}</div>
                      </div>
                      <Badge text={st.status === 'active' ? 'Aktif' : 'Pasif'} color={st.status === 'active' ? COLORS.green : COLORS.gray} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.grayLight}` }}>
                      <div style={{ fontSize: 12 }}>
                        PIN: <span style={{ fontWeight: 800, background: COLORS.warmGray, padding: '3px 10px', borderRadius: 6, letterSpacing: 3 }}>{st.pin}</span>
                      </div>
                      <div onClick={() => { setEditingStaff(st.id); setEditForm({ username: st.username, pin: st.pin, role: st.role, branch: st.branch }); }} style={{ fontSize: 12, color: COLORS.blue, fontWeight: 700, cursor: 'pointer', background: COLORS.blueBg, padding: '5px 12px', borderRadius: 8 }}>
                        ✏️ Düzenle
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        ))}
      </div>}

      {/* KAMPANYALAR */}
      {tab === 'camp' && <div style={{ padding: '14px 16px' }}>
        {/* Yeni kampanya */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>➕ Yeni Kampanya Oluştur</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Başlık</div>
            <input placeholder="Örn: Hafta Sonu %20 İndirim" value={newCamp.title} onChange={e => setNewCamp(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${COLORS.grayLight}`, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Açıklama</div>
            <input placeholder="Kampanya detayı..." value={newCamp.desc} onChange={e => setNewCamp(p => ({ ...p, desc: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${COLORS.grayLight}`, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, marginBottom: 4 }}>Hedef Kitle</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[['all', 'Tüm Üyeler'], ['goat', 'GOAT'], ['mudavim', 'Müdavim'], ['misafir', 'Yeni Üyeler']].map(([v, l]) => (
                <div key={v} onClick={() => setNewCamp(p => ({ ...p, target: v }))} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: newCamp.target === v ? COLORS.fioreOrange : COLORS.warmGray, color: newCamp.target === v ? COLORS.fioreBeyaz : COLORS.grayDark }}>{l}</div>
              ))}
            </div>
          </div>
          <Btn onClick={async () => {
            if (!newCamp.title.trim()) { msg('Başlık girin!'); return; }
            try {
              const docRef = await addDoc(collection(db, 'campaigns'), {
                title: newCamp.title.trim(),
                description: newCamp.desc.trim(),
                target: newCamp.target,
                active: true,
                createdAt: serverTimestamp(),
              });
              setCampaigns(p => [{ id: docRef.id, title: newCamp.title.trim(), description: newCamp.desc.trim(), target: newCamp.target, active: true, createdAt: { seconds: Date.now() / 1000 } }, ...p]);
              setNewCamp({ title: '', desc: '', target: 'all' });
              msg('✓ Kampanya yayınlandı!');
            } catch (e) { msg('Hata!'); }
          }} color={COLORS.green}>🚀 Yayınla</Btn>
        </Card>

        {/* Aktif kampanyalar */}
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📢 Aktif Kampanyalar</div>
        {campaigns.filter(c => c.active).length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 20, marginBottom: 14 }}><div style={{ color: COLORS.gray }}>Aktif kampanya yok</div></Card>
        ) : campaigns.filter(c => c.active).map(c => (
          <Card key={c.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</div>
                {c.description && <div style={{ fontSize: 12, color: COLORS.grayDark, marginTop: 3 }}>{c.description}</div>}
                <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>Hedef: {c.target === 'all' ? 'Tüm Üyeler' : c.target === 'goat' ? 'GOAT' : c.target === 'mudavim' ? 'Müdavim' : 'Yeni Üyeler'}</div>
              </div>
              <Badge text="AKTİF" color={COLORS.green} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1 }} onClick={async () => {
                await updateDoc(doc(db, 'campaigns', c.id), { active: false });
                setCampaigns(p => p.map(x => x.id === c.id ? { ...x, active: false } : x));
                msg('Kampanya durduruldu');
              }}><Btn color={COLORS.gray} sm>Durdur</Btn></div>
              <div style={{ flex: 1 }} onClick={async () => {
                await deleteDoc(doc(db, 'campaigns', c.id));
                setCampaigns(p => p.filter(x => x.id !== c.id));
                msg('Kampanya silindi');
              }}><Btn color={COLORS.red} sm>Sil</Btn></div>
            </div>
          </Card>
        ))}

        {/* Geçmiş */}
        {campaigns.filter(c => !c.active).length > 0 && <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, marginTop: 14 }}>📦 Geçmiş Kampanyalar</div>
          {campaigns.filter(c => !c.active).map(c => (
            <div key={c.id} style={{ background: COLORS.fioreBeyaz, borderRadius: 12, padding: '10px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</div><div style={{ fontSize: 10, color: COLORS.gray }}>{c.target === 'all' ? 'Tüm Üyeler' : c.target}</div></div>
              <Badge text="Tamamlandı" color={COLORS.gray} />
            </div>
          ))}
        </>}
      </div>}

      {/* İŞLEM LOG */}
      {tab === 'logs' && <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, color: COLORS.grayDark, marginBottom: 10, background: COLORS.warmGray, padding: '8px 12px', borderRadius: 10, fontWeight: 600 }}>
          ℹ️ Loglar haftalık olarak otomatik sıfırlanır
        </div>
        {stampLogs.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 30 }}>
            <div style={{ fontSize: 15, color: COLORS.gray, fontWeight: 600 }}>Henüz işlem yok</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>Personel girişinden damga ekleyin!</div>
          </Card>
        ) : stampLogs.map((l, i) => (
          <div key={l.id || i} style={{ background: COLORS.fioreBeyaz, borderRadius: 14, padding: '12px 16px', marginBottom: 6, boxShadow: '0 1px 6px rgba(3,3,3,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{l.customerName}</span>
                <span style={{ fontSize: 11, color: COLORS.gray, marginLeft: 8 }}>
                  {l.timestamp?.toDate?.()?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + l.timestamp?.toDate?.()?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) || ''}
                </span>
              </div>
              <Badge
                text={l.type === 'stamp' ? 'DAMGA' : l.type === 'goat_monthly' ? 'GOAT AYLIK' : 'ÜCRETSİZ'}
                color={l.type === 'stamp' ? COLORS.fioreOrange : l.type === 'goat_monthly' ? COLORS.gold : COLORS.green}
              />
            </div>
            <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 5 }}>
              Personel: {l.staffName} · {branches[l.branchId]?.shortName || branches[l.branchId]?.name || l.branchId}
            </div>
            {l.type === 'stamp' && (
              <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 2 }}>
                Ürün: {STAMP_CATEGORIES.find(c => c.id === l.productCategory)?.name || l.productCategory} · Kart: {l.cardBefore}→{l.cardAfter}/7
              </div>
            )}
          </div>
        ))}
      </div>}
    </div>
  );
}
