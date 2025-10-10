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
  const [userAccessLevel, setUserAccessLevel] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userUsername, setUserUsername] = useState("");
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
          setUserAccessLevel(currentUser?.accessLevel || "");
          setUserDepartment(currentUser?.department || "");
          setUserFirstName(currentUser?.firstName || "");
          setUserLastName(currentUser?.lastName || "");
          setUserUsername(currentUser?.username || "");
        }
      }
      setLoading(false);
    };
    checkRole();
  }, [user]);

  const value = {
    isAdmin,
    userMunicipality,
    userAccessLevel,
    userDepartment,
    userFirstName,
    userLastName,
    userUsername,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
