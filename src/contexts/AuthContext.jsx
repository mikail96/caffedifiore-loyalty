import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Firebase auth user
  const [userData, setUserData] = useState(null);  // Firestore user data
  const [role, setRole] = useState(null);          // 'customer' | 'staff' | 'admin' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Müşteri mi kontrol et
        const customerDoc = await getDoc(doc(db, 'customers', firebaseUser.uid));
        if (customerDoc.exists()) {
          setUserData(customerDoc.data());
          setRole('customer');
        }
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Personel girişi (kullanıcı adı + PIN)
  const loginAsStaff = async (staffData) => {
    setUserData(staffData);
    setRole('staff');
  };

  // Admin girişi (kullanıcı adı + şifre + SMS)
  const loginAsAdmin = async (adminData) => {
    setUserData(adminData);
    setRole('admin');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Staff/admin Firebase auth kullanmıyor
    }
    setUser(null);
    setUserData(null);
    setRole(null);
  };

  const value = {
    user,
    userData,
    role,
    loading,
    loginAsStaff,
    loginAsAdmin,
    logout,
    setUserData, // Profil güncellemelerinde
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
