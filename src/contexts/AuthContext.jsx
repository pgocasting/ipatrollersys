import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../hooks/useFirebase';
import { logAdminLogin } from '../utils/adminLogger';
import { logUserLogin } from '../utils/universalLogger';

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
          const isAdminUser = currentUser?.role === "Admin";
          const userAccessLevelValue = currentUser?.accessLevel || "";
          
          setIsAdmin(isAdminUser);
          setUserMunicipality(currentUser?.municipality || "");
          setUserAccessLevel(userAccessLevelValue);
          setUserDepartment(currentUser?.department || "");
          setUserFirstName(currentUser?.firstName || "");
          setUserLastName(currentUser?.lastName || "");
          setUserUsername(currentUser?.username || "");

          // Log user access for all users
          const userInfo = {
            email: user.email,
            firstName: currentUser?.firstName || "",
            lastName: currentUser?.lastName || "",
            username: currentUser?.username || "",
            userAccessLevel: userAccessLevelValue,
            accessLevel: userAccessLevelValue,
            municipality: currentUser?.municipality || "",
            department: currentUser?.department || "",
            isAdmin: isAdminUser,
            role: currentUser?.role || ""
          };
          
          // Log user login for all users
          await logUserLogin(userInfo);
          
          // Also log admin login if user is admin
          if (isAdminUser || userAccessLevelValue === 'admin') {
            await logAdminLogin(userInfo);
          }
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
