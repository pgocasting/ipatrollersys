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

  const signIn = async (username, password, keepLoggedIn = false) => {
    try {
      setLoading(true);
      
      // First, get the user's email from Firestore using the username
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('User management data not found');
      }

      const data = docSnap.data();
      const users = data.users || [];
      const userRecord = users.find(u => u.username === username);

      if (!userRecord) {
        throw new Error('User not found');
      }

      if (keepLoggedIn) {
        await setPersistence(auth, browserLocalPersistence);
      }

      // Now sign in with the email
      const userCredential = await signInWithEmailAndPassword(auth, userRecord.email, password);
      const user = userCredential.user;
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      let errorMessage = 'Sign in failed';
      
      if (error.code === 'permission-denied') {
        console.error('Permission denied error. Please check Firestore rules.');
        errorMessage = 'System error: Unable to verify credentials';
      } else if (error.message === 'User not found') {
        errorMessage = 'Username not found';
      } else if (error.message === 'User management data not found') {
        errorMessage = 'System error: User data not available';
      } else {
        switch (error.code) {
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection';
            break;
          default:
            console.error('Detailed error:', error);
            errorMessage = 'Login failed. Please try again.';
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserRole = async () => {
    try {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }

      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('📝 No management document found in Firestore');
        return { success: false, error: "User management data not found" };
      }

      const data = docSnap.data();
      const users = data.users || [];
      const currentUser = users.find(u => u.email === user.email);
      
      if (currentUser?.role) {
        return { success: true, data: { role: currentUser.role } };
      } else {
        return { success: false, error: "Role not found" };
      }
    } catch (error) {
      console.error('❌ Error getting current user role:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
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

  // Command Center - Barangay Management Functions
  const getBarangays = async () => {
    try {
      console.log('🔍 Fetching barangays from Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const docRef = doc(db, 'commandCenter', 'barangays');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const barangays = docSnap.data().barangays || [];
        console.log('✅ Found barangays in Firestore:', barangays.length);
        return { success: true, data: barangays };
      } else {
        console.log('📝 No barangays document found in Firestore, returning empty array');
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('❌ Error fetching barangays from Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  // Command Center - Concern Type Management Functions
  const getConcernTypes = async () => {
    try {
      console.log('🔍 Fetching concern types from Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const docRef = doc(db, 'commandCenter', 'concernTypes');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const concernTypes = docSnap.data().concernTypes || [];
        console.log('✅ Found concern types in Firestore:', concernTypes.length);
        return { success: true, data: concernTypes };
      } else {
        console.log('📝 No concern types document found in Firestore, returning empty array');
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('❌ Error fetching concern types from Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  // Command Center - Weekly Reports Functions
  const getWeeklyReport = async (monthYear) => {
    try {
      console.log('🔍 Fetching weekly report from Firestore for:', monthYear);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const docRef = doc(db, 'commandCenter', `weeklyReports_${monthYear}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const reportData = docSnap.data().data || {};
        console.log('✅ Found weekly report in Firestore for:', monthYear);
        return { success: true, data: reportData };
      } else {
        console.log('📝 No weekly report found in Firestore for:', monthYear);
        return { success: true, data: {} };
      }
    } catch (error) {
      console.error('❌ Error fetching weekly report from Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  const saveWeeklyReport = async (reportKey, reportData) => {
    try {
      console.log('💾 Saving weekly report to Firestore for:', reportKey);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }
      
      const docRef = doc(db, 'commandCenter', `weeklyReports_${reportKey}`);
      await setDoc(docRef, {
        data: reportData,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      }, { merge: true });
      
      console.log('✅ Weekly report saved successfully to Firestore for:', reportKey);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving weekly report to Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  // Save barangays to Firestore
  const saveBarangays = async (barangays) => {
    try {
      console.log('💾 Saving barangays to Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }
      
      const docRef = doc(db, 'commandCenter', 'barangays');
      await setDoc(docRef, {
        barangays: barangays,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      }, { merge: true });
      
      console.log('✅ Barangays saved successfully to Firestore:', barangays.length);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving barangays to Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  // Save concern types to Firestore
  const saveConcernTypes = async (concernTypes) => {
    try {
      console.log('💾 Saving concern types to Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }
      
      const docRef = doc(db, 'commandCenter', 'concernTypes');
      await setDoc(docRef, {
        concernTypes: concernTypes,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      }, { merge: true });
      
      console.log('✅ Concern types saved successfully to Firestore:', concernTypes.length);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving concern types to Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  // Get users list from management document
  const getUsers = async () => {
    try {
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const users = data.users || [];
        return { success: true, data: users };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return { success: false, error: error.message };
    }
  };

  // Admin user creation function
  const createUserByAdmin = async (email, password, userData) => {
    try {
      if (!user) {
        return { success: false, error: "No admin user logged in" };
      }

      // Check if current user is admin
      const currentUserRole = await getCurrentUserRole();
      if (!currentUserRole.success || currentUserRole.data.role !== "Admin") {
        return { success: false, error: "Only admin users can create new accounts" };
      }

      // Create user in Firebase Auth using the API key from firebase config
      const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBeRQNGiuTIqFHIF7m1Z4DMhtlo9BlMQNo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error.message || 'Failed to create user');
      }

      // Add user to Firestore management document
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: "Management document not found" };
      }

      const currentData = docSnap.data();
      const users = currentData.users || [];

      const newUser = {
        ...userData,
        email: email,
        status: "Active",
        createdAt: new Date().toISOString(),
        createdBy: user.email,
        id: users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1
      };

      await setDoc(docRef, {
        ...currentData,
        users: [...users, newUser],
        updatedAt: new Date(),
        updatedBy: user.uid
      });

      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    getCurrentUserRole,
    changePassword,
    getBarangays,
    saveBarangays,
    getConcernTypes,
    saveConcernTypes,
    getWeeklyReport,
    saveWeeklyReport,
    createUserByAdmin,
    getUsers
  };
};