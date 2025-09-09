import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../hooks/useFirebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { user } = useFirebase();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userMunicipality, setUserMunicipality] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        const docRef = doc(db, 'users', 'management');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const users = data.users || [];
          const currentUser = users.find(u => u.email === user.email);
          setIsAdmin(currentUser?.role === "Admin");
          setUserMunicipality(currentUser?.municipality || "");
        }
      }
      setLoading(false);
    };
    checkRole();
  }, [user]);

  const value = {
    isAdmin,
    userMunicipality,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
