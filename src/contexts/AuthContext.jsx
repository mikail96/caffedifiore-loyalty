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

  const loadCustomerData = async (uid) => {
    const customerDoc = await getDoc(doc(db, 'customers', uid));
    if (customerDoc.exists()) {
      setUserData(customerDoc.data());
      setRole('customer');
      return true;
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Önceki snapshot dinleyiciyi temizle
      if (snapshotUnsub.current) { snapshotUnsub.current(); snapshotUnsub.current = null; }

      if (firebaseUser) {
        setUser(firebaseUser);
        await loadCustomerData(firebaseUser.uid);

        // Tek oturum dinleyici
        snapshotUnsub.current = onSnapshot(doc(db, 'customers', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            const localSession = sessionStorage.getItem('cdf_session');
            // Sadece localSession varsa ve eşleşmiyorsa at
            if (localSession && data.sessionId && data.sessionId !== localSession) {
              setSessionKicked(true);
              signOut(auth);
            }
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
    if (auth.currentUser) {
      await loadCustomerData(auth.currentUser.uid);
    }
  };

  const loginAsStaff = async (staffData) => { setUserData(staffData); setRole('staff'); };
  const loginAsAdmin = async (adminData) => { setUserData(adminData); setRole('admin'); };

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
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
