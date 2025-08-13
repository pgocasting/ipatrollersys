import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user (logged out)');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Authentication functions
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check user role in Firestore
      const userRole = await checkUserRole(email);
      if (!userRole.success) {
        await signOut(auth);
        return { success: false, error: "User not found in system or account disabled" };
      }

      if (userRole.data.status === 'Inactive') {
        await signOut(auth);
        return { success: false, error: "Account is disabled. Please contact administrator." };
      }

      return { 
        success: true, 
        user: userCredential.user,
        role: userRole.data.role,
        userData: userRole.data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Check user role in Firestore
  const checkUserRole = async (email) => {
    try {
      const usersResult = await getUsers();
      if (!usersResult.success) {
        return { success: false, error: "Error checking user permissions" };
      }

      const users = usersResult.data || [];
      const user = users.find(u => u.email === email);
      
      if (!user) {
        // If user doesn't exist in Firestore but exists in Firebase Auth, create them
        if (email === "admin@ipatroller.gov.ph") {
          console.log('🔧 Creating admin user in Firestore...');
          const adminUser = {
            name: "Administrator",
            email: "admin@ipatroller.gov.ph",
            role: "Admin",
            status: "Active",
            lastLogin: new Date().toISOString(),
            district: "ALL DISTRICTS",
          };
          
          const addResult = await addUser(adminUser);
          if (addResult.success) {
            console.log('✅ Admin user created in Firestore');
            return { success: true, data: addResult.user };
          } else {
            return { success: false, error: "Failed to create admin user in system" };
          }
        }
        
        return { success: false, error: "User not found in system. Please contact administrator." };
      }

      return { success: true, data: user };
    } catch (error) {
      console.error('Error checking user role:', error);
      return { success: false, error: error.message };
    }
  };

  // Get current user's role
  const getCurrentUserRole = async () => {
    try {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      const usersResult = await getUsers();
      if (!usersResult.success) {
        return { success: false, error: "Error getting user data" };
      }

      const users = usersResult.data || [];
      const currentUser = users.find(u => u.email === user.email);
      
      if (!currentUser) {
        return { success: false, error: "User not found in system" };
      }

      return { success: true, data: currentUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Check if user has permission for specific action
  const hasPermission = (userRole, requiredRole) => {
    const roleHierarchy = {
      'Admin': 3,
      'AdminUser': 2,
      'User': 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const signUp = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Firestore functions for patrol data
  const savePatrolData = async (monthKey, data) => {
    try {
      const docRef = doc(db, 'patrolData', monthKey);
      await setDoc(docRef, {
        data: data,
        updatedAt: new Date(),
        userId: user?.uid
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getPatrolData = async (monthKey) => {
    try {
      const docRef = doc(db, 'patrolData', monthKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data().data };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getAllPatrolData = async () => {
    try {
      const q = query(collection(db, 'patrolData'), where('userId', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const data = {};
      
      querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data().data;
      });
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deletePatrolData = async (monthKey) => {
    try {
      const docRef = doc(db, 'patrolData', monthKey);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // User management functions
  const saveUsers = async (users) => {
    try {
      const docRef = doc(db, 'users', 'management');
      await setDoc(docRef, {
        users: users,
        updatedAt: new Date(),
        updatedBy: user?.uid
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getUsers = async () => {
    try {
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: docSnap.data().users };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const addUser = async (userData) => {
    try {
      const usersResult = await getUsers();
      if (!usersResult.success) {
        throw new Error(usersResult.error);
      }

      const existingUsers = usersResult.data || [];
      const newUser = {
        ...userData,
        id: Math.max(...existingUsers.map(u => u.id), 0) + 1,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "admin@ipatroller.gov.ph"
      };

      const updatedUsers = [...existingUsers, newUser];
      const saveResult = await saveUsers(updatedUsers);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const usersResult = await getUsers();
      if (!usersResult.success) {
        throw new Error(usersResult.error);
      }

      const existingUsers = usersResult.data || [];
      const updatedUsers = existingUsers.map(u => 
        u.id === userId ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
      );

      const saveResult = await saveUsers(updatedUsers);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const usersResult = await getUsers();
      if (!usersResult.success) {
        throw new Error(usersResult.error);
      }

      const existingUsers = usersResult.data || [];
      const updatedUsers = existingUsers.filter(u => u.id !== userId);

      const saveResult = await saveUsers(updatedUsers);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Action Reports functions
  const saveActionReport = useCallback(async (actionReport) => {
    try {
      const docRef = doc(db, 'actionReports', actionReport.id);
      await setDoc(docRef, {
        ...actionReport,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || user?.email,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user]);

  const getActionReports = useCallback(async () => {
    try {
      const q = query(collection(db, 'actionReports'));
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamps to JavaScript Date objects or strings
        if (data.when && typeof data.when === 'object' && data.when.seconds) {
          // Convert Firestore Timestamp to Date
          data.when = new Date(data.when.seconds * 1000);
        }
        reports.push({ id: doc.id, ...data });
      });
      
      return { success: true, data: reports };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateActionReport = useCallback(async (reportId, updates) => {
    try {
      const docRef = doc(db, 'actionReports', reportId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || user?.email
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user]);

  const deleteActionReport = useCallback(async (reportId) => {
    try {
      const docRef = doc(db, 'actionReports', reportId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    savePatrolData,
    getPatrolData,
    getAllPatrolData,
    deletePatrolData,
    saveUsers,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getCurrentUserRole,
    hasPermission,
    saveActionReport,
    getActionReports,
    updateActionReport,
    deleteActionReport
  };
}; 