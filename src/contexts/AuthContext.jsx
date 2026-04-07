import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  const [userViewingPage, setUserViewingPage] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userProfileName, setUserProfileName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [loading, setLoading] = useState(true);

  const normalizeViewingPage = (page) => {
    if (!page) return "";
    const raw = String(page).trim();
    if (!raw) return "";
    const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");

    const labelMap = {
      dashboard: "dashboard",
      ipatroller: "ipatroller",
      commandcenter: "commandcenter",
      actioncenter: "actioncenter",
      incidents: "incidents",
    };

    return labelMap[key] || raw;
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', 'management');
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const users = data.users || [];
        const currentUser = users.find(u => u.email === user.email);
        const isAdminUser = currentUser?.role === "Admin";
        const userAccessLevelValue = currentUser?.accessLevel || "";
        
        setIsAdmin(isAdminUser);
        setUserMunicipality(currentUser?.municipality || "");
        setUserAccessLevel(userAccessLevelValue);
        setUserViewingPage(
          normalizeViewingPage(
            currentUser?.viewingPage ||
              currentUser?.allowedPage ||
              currentUser?.viewPage ||
              currentUser?.page ||
              ""
          )
        );
        setUserDepartment(currentUser?.department || "");
        setUserUsername(currentUser?.username || "");
        setUserProfileName(currentUser?.profileName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || user.displayName || "Administrator");
        setUserAvatar(currentUser?.avatar || "");

        // Log user access
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
        
        if (isAdminUser || userAccessLevelValue === 'admin') {
          await logAdminLogin(userInfo);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Auth listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const value = {
    isAdmin,
    userMunicipality,
    userAccessLevel,
    userViewingPage,
    userDepartment,
    userUsername,
    userProfileName,
    userAvatar,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
