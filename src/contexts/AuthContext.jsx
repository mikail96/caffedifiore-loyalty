import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadCustomerData(firebaseUser.uid);
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadCustomerData(auth.currentUser.uid);
    }
  };

  // Session kontrolü: Firestore'daki sessionId ile yerel eşleşiyor mu?
  const checkSession = async () => {
    if (!auth.currentUser) return true;
    try {
      const snap = await getDoc(doc(db, 'customers', auth.currentUser.uid));
      if (!snap.exists()) return true;
      const localSession = sessionStorage.getItem('cdf_session');
      const remoteSession = snap.data().sessionId;
      if (localSession && remoteSession && localSession !== remoteSession) {
        return false; // Başka cihaz giriş yapmış
      }
    } catch (e) {}
    return true;
  };

  const loginAsStaff = async (staffData) => { setUserData(staffData); setRole('staff'); };
  const loginAsAdmin = async (adminData) => { setUserData(adminData); setRole('admin'); };

  const logout = async () => {
    try { await signOut(auth); } catch (e) {}
    sessionStorage.removeItem('cdf_session');
    setUser(null); setUserData(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, role, loading, loginAsStaff, loginAsAdmin, logout, refreshUser, setUserData, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
