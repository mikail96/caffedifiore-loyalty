import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../config/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionKicked, setSessionKicked] = useState(false);
  const snapshotUnsub = useRef(null);
  const loginGrace = useRef(false); // Login sonrası koruma

  const ADMIN_DOMAIN = 'caffedifiore-loyalty.firebaseapp.com';

  const loadCustomerData = async (uid) => {
    const snap = await getDoc(doc(db, 'customers', uid));
    if (snap.exists()) { setUserData(snap.data()); setRole('customer'); return true; }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (snapshotUnsub.current) { snapshotUnsub.current(); snapshotUnsub.current = null; }

      if (firebaseUser) {
        // Admin kontrolü — email domain'den tanı
        if (firebaseUser.email?.endsWith(`@${ADMIN_DOMAIN}`)) {
          setUser(firebaseUser);
          // Admin ise Firestore'dan admin verilerini yükle
          try {
            const settingsSnap = await getDoc(doc(db, 'settings', 'admin'));
            if (settingsSnap.exists()) {
              setUserData({ ...settingsSnap.data(), role: 'admin' });
              setRole('admin');
            }
          } catch (e) {}
          setLoading(false);
          return; // Admin için session listener kurma
        }

        // Müşteri akışı
        setUser(firebaseUser);
        await loadCustomerData(firebaseUser.uid);

        // Login sonrası 3sn koruma — sessionId yazılmasını bekle
        loginGrace.current = true;
        setTimeout(() => { loginGrace.current = false; }, 3000);

        // Gerçek zamanlı oturum dinleyici
        snapshotUnsub.current = onSnapshot(doc(db, 'customers', firebaseUser.uid), (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          setUserData(data);

          // Koruma süresi içindeyse kontrol etme
          if (loginGrace.current) return;

          const local = sessionStorage.getItem('cdf_session');
          if (local && data.sessionId && local !== data.sessionId) {
            console.log('Session kicked:', local, '!=', data.sessionId);
            setSessionKicked(true);
            if (snapshotUnsub.current) { snapshotUnsub.current(); snapshotUnsub.current = null; }
            signOut(auth).catch(() => {});
          }
        });
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (snapshotUnsub.current) snapshotUnsub.current();
    };
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) await loadCustomerData(auth.currentUser.uid);
  };

  const loginAsStaff = async (d) => { setUserData(d); setRole('staff'); };
  const loginAsAdmin = async (d) => { setUserData(d); setRole('admin'); };

  const logout = async () => {
    if (snapshotUnsub.current) { snapshotUnsub.current(); snapshotUnsub.current = null; }
    try { await signOut(auth); } catch (e) {}
    sessionStorage.removeItem('cdf_session');
    setUser(null); setUserData(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, role, loading, loginAsStaff, loginAsAdmin, logout, refreshUser, setUserData, sessionKicked, setSessionKicked }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
