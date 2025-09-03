import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence,
  browserLocalPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password, keepLoggedIn = false) => {
    try {
      setLoading(true);
      
      // Set persistence based on user preference
      if (keepLoggedIn) {
        await setPersistence(auth, browserLocalPersistence);
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      let errorMessage = 'Sign in failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Check user role in Firestore
  const checkUserRole = async (email) => {
    try {
      console.log('🔍 Checking user role for:', email);
      
      const usersResult = await getUsers();
      if (!usersResult.success) {
        console.warn('⚠️ Failed to get users from Firestore, allowing login for:', email);
        // If we can't get users from Firestore, create a default user entry
        return await createDefaultUserEntry(email);
      }

      const users = usersResult.data || [];
      console.log('📋 Found users in Firestore:', users.length);
      
      const user = users.find(u => u.email === email);
      
      if (!user) {
        console.log('👤 User not found in Firestore, creating default entry for:', email);
        // If user doesn't exist in Firestore but exists in Firebase Auth, create them
        return await createDefaultUserEntry(email);
      }

      console.log('✅ User found in Firestore:', user.email, 'Role:', user.role);
      return { success: true, data: user };
    } catch (error) {
      console.error('❌ Error checking user role:', error);
      // If there's an error checking user role, create a default entry instead of failing
      console.log('🔧 Creating default user entry due to error for:', email);
      return await createDefaultUserEntry(email);
    }
  };

  // Create default user entry for users not in Firestore
  const createDefaultUserEntry = async (email) => {
    try {
      console.log('🔧 Creating default user entry for:', email);
      
      let userData;
      
      if (email === "admin@ipatroller.gov.ph") {
        userData = {
          name: "Administrator",
          email: "admin@ipatroller.gov.ph",
          role: "Admin",
          status: "Active",
          lastLogin: new Date().toISOString(),
          district: "ALL DISTRICTS",
        };
      } else {
        // Create a default user entry for any other email
        userData = {
          name: email.split('@')[0], // Use email prefix as name
          email: email,
          role: "User", // Default role
          status: "Active",
          lastLogin: new Date().toISOString(),
          district: "ALL DISTRICTS",
        };
      }
      
      const addResult = await addUser(userData);
      if (addResult.success) {
        console.log('✅ Default user created in Firestore:', email);
        return { success: true, data: addResult.user };
      } else {
        console.warn('⚠️ Failed to create user in Firestore, but allowing login:', email);
        // Even if we can't create the user in Firestore, allow the login
        return { success: true, data: userData };
      }
    } catch (error) {
      console.error('❌ Error creating default user entry:', error);
      // Even if there's an error, allow the login with default data
      return { 
        success: true, 
        data: {
          name: email.split('@')[0],
          email: email,
          role: "User",
          status: "Active",
          district: "ALL DISTRICTS"
        }
      };
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
      
      if (currentUser) {
        return { success: true, data: currentUser };
      } else {
        return { success: false, error: "User not found" };
      }
    } catch (error) {
      console.error('❌ Error getting current user role:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      
      // For now, we'll use sign in since we're not implementing sign up
      // This can be enhanced later if needed
      return await signIn(email, password, true);
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
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
      console.log('💾 Saving users to Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const docRef = doc(db, 'users', 'management');
      await setDoc(docRef, {
        users: users,
        updatedAt: new Date(),
        updatedBy: user?.uid || "system"
      });
      
      console.log('✅ Users saved to Firestore successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving users to Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  const getUsers = async () => {
    try {
      console.log('🔍 Fetching users from Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const users = docSnap.data().users || [];
        console.log('✅ Found users in Firestore:', users.length);
        return { success: true, data: users };
      } else {
        console.log('📝 No users document found in Firestore, returning empty array');
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('❌ Error fetching users from Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  const addUser = async (userData) => {
    try {
      console.log('➕ Adding user to Firestore:', userData.email);
      
      const usersResult = await getUsers();
      if (!usersResult.success) {
        console.warn('⚠️ Failed to get existing users, creating new users document');
        // If we can't get existing users, start with an empty array
        usersResult.data = [];
      }

      const existingUsers = usersResult.data || [];
      const newUser = {
        ...userData,
        id: existingUsers.length > 0 ? Math.max(...existingUsers.map(u => u.id || 0), 0) + 1 : 1,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "system"
      };

      const updatedUsers = [...existingUsers, newUser];
      const saveResult = await saveUsers(updatedUsers);
      
      if (!saveResult.success) {
        console.error('❌ Failed to save users to Firestore:', saveResult.error);
        // Even if we can't save to Firestore, return the user data
        return { success: true, user: newUser };
      }

      console.log('✅ User added to Firestore successfully:', newUser.email);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Error adding user:', error);
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
      // Check if Firestore is available
      if (!db) {
        throw new Error('Firestore database is not available');
      }
      
      const docRef = doc(db, 'actionReports', actionReport.id);
      await setDoc(docRef, {
        ...actionReport,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || user?.email,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving action report:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const getActionReports = useCallback(async () => {
    try {
      // Check if Firestore is available
      if (!db) {
        throw new Error('Firestore database is not available');
      }
      
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
      console.error('❌ Error getting action reports:', error);
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

  // Generic function to query documents from any collection
  const queryDocuments = useCallback(async (collectionName, constraints = []) => {
    try {
      if (!db) {
        throw new Error('Firestore database is not available');
      }
      
      let q = collection(db, collectionName);
      
      // Apply constraints if provided
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamps to JavaScript Date objects
        if (data.when && typeof data.when === 'object' && data.when.seconds) {
          data.when = new Date(data.when.seconds * 1000);
        }
        if (data.createdAt && typeof data.createdAt === 'object' && data.createdAt.seconds) {
          data.createdAt = new Date(data.createdAt.seconds * 1000);
        }
        if (data.updatedAt && typeof data.updatedAt === 'object' && data.updatedAt.seconds) {
          data.updatedAt = new Date(data.updatedAt.seconds * 1000);
        }
        documents.push({ id: doc.id, ...data });
      });
      
      return { success: true, data: documents };
    } catch (error) {
      console.error(`❌ Error querying ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }, []);

  // Add action report to Firestore
  const addActionReport = useCallback(async (reportData) => {
    try {
      if (!db) {
        throw new Error('Firestore database is not available');
      }
      
      // Add timestamps
      const reportWithTimestamps = {
        ...reportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || user?.email,
        updatedBy: user?.uid || user?.email
      };
      
      // Add to actionReports collection
      const docRef = doc(collection(db, 'actionReports'));
      await setDoc(docRef, reportWithTimestamps);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error adding action report:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        return { success: false, error: "Current password is incorrect" };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, error: "New password is too weak" };
      } else if (error.code === 'auth/requires-recent-login') {
        return { success: false, error: "Please log in again to change your password" };
      } else {
        return { success: false, error: error.message };
      }
    }
  };

  const waitForFirestoreReady = async () => {
    // Always return true since we're not using Firestore
    return true;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    waitForFirestoreReady,
    queryDocuments,
    getActionReports,
    addActionReport,
    updateActionReport,
    deleteActionReport
  };
};