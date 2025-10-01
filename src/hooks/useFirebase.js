import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
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

      // Set authentication persistence
      if (keepLoggedIn) {
        // Keep user logged in across browser sessions (persistent)
        await setPersistence(auth, browserLocalPersistence);
      } else {
        // Auto-logout when browser is closed (session only)
        await setPersistence(auth, browserSessionPersistence);
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
        const fullDocData = docSnap.data();
        console.log('✅ Found weekly report in Firestore for:', monthYear);
        console.log('📊 Document structure:', Object.keys(fullDocData));
        
        // Return the full document data to match what the loading function expects
        return { success: true, data: fullDocData };
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

  // New Weekly Reports Collection Functions
  const saveWeeklyReportToCollection = async (reportData) => {
    try {
      console.log('💾 Saving weekly report to weeklyReports collection...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }

      // Generate a unique document ID based on month, year, and municipality
      const { selectedMonth, selectedYear, activeMunicipalityTab } = reportData;
      const docId = `${selectedMonth}_${selectedYear}_${activeMunicipalityTab || 'All'}_${Date.now()}`;
      
      const docRef = doc(db, 'weeklyReports', docId);
      await setDoc(docRef, {
        ...reportData,
        id: docId,
        createdAt: new Date().toISOString(),
        createdBy: user.email,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      });
      
      console.log('✅ Weekly report saved successfully to weeklyReports collection:', docId);
      return { success: true, docId };
    } catch (error) {
      console.error('❌ Error saving weekly report to collection:', error);
      return { success: false, error: error.message };
    }
  };

  // Save weekly report under commandCenter/weeklyReports/<Municipality>/<Month_Year>
  const saveWeeklyReportByMunicipality = async (reportData) => {
    try {
      console.log('💾 Saving weekly report by municipality...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }

      const { selectedMonth, selectedYear, activeMunicipalityTab } = reportData;
      const municipality = activeMunicipalityTab || 'All';
      const docId = `${selectedMonth}_${selectedYear}`;

      const municipalDocRef = doc(db, 'commandCenter', 'weeklyReports', municipality, docId);
      await setDoc(municipalDocRef, {
        ...reportData,
        id: docId,
        municipality: municipality,
        createdAt: new Date().toISOString(),
        createdBy: user.email,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      }, { merge: true });

      console.log('✅ Weekly report saved by municipality:', municipality, docId);
      return { success: true, docId };
    } catch (error) {
      console.error('❌ Error saving weekly report by municipality:', error);
      return { success: false, error: error.message };
    }
  };

  const getWeeklyReportsFromCollection = async (filters = {}) => {
    try {
      console.log('🔍 Fetching weekly reports from collection with filters:', filters);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const collectionRef = collection(db, 'weeklyReports');
      let q = collectionRef;
      
      // Apply filters if provided
      if (filters.month) {
        q = query(q, where('selectedMonth', '==', filters.month));
      }
      if (filters.year) {
        q = query(q, where('selectedYear', '==', filters.year));
      }
      if (filters.municipality) {
        q = query(q, where('activeMunicipalityTab', '==', filters.municipality));
      }
      
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ Found weekly reports in collection:', reports.length);
      return { success: true, data: reports };
    } catch (error) {
      console.error('❌ Error fetching weekly reports from collection:', error);
      return { success: false, error: error.message };
    }
  };

  const updateWeeklyReportInCollection = async (docId, updateData) => {
    try {
      console.log('🔄 Updating weekly report in collection:', docId);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }
      
      const docRef = doc(db, 'weeklyReports', docId);
      await updateDoc(docRef, {
        ...updateData,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      });
      
      console.log('✅ Weekly report updated successfully in collection:', docId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating weekly report in collection:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteWeeklyReportFromCollection = async (docId) => {
    try {
      console.log('🗑️ Deleting weekly report from collection:', docId);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }
      
      const docRef = doc(db, 'weeklyReports', docId);
      await deleteDoc(docRef);
      
      console.log('✅ Weekly report deleted successfully from collection:', docId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting weekly report from collection:', error);
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

  // Admin user update function
  const updateUser = async (userId, userData) => {
    try {
      if (!user) {
        return { success: false, error: "No admin user logged in" };
      }

      // Check if current user is admin
      const currentUserRole = await getCurrentUserRole();
      if (!currentUserRole.success || currentUserRole.data.role !== "Admin") {
        return { success: false, error: "Only admin users can update user accounts" };
      }

      // Update user in Firestore management document
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: "Management document not found" };
      }

      const currentData = docSnap.data();
      const users = currentData.users || [];
      
      // Find the user to update
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: "User not found" };
      }

      // Update the user data
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        ...userData,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      };

      await setDoc(docRef, {
        ...currentData,
        users: updatedUsers,
        updatedAt: new Date(),
        updatedBy: user.uid
      });

      return { success: true, user: updatedUsers[userIndex] };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  // Admin user delete function
  const deleteUser = async (userId) => {
    try {
      if (!user) {
        return { success: false, error: "No admin user logged in" };
      }

      // Check if current user is admin
      const currentUserRole = await getCurrentUserRole();
      if (!currentUserRole.success || currentUserRole.data.role !== "Admin") {
        return { success: false, error: "Only admin users can delete user accounts" };
      }

      // Delete user from Firestore management document
      const docRef = doc(db, 'users', 'management');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: "Management document not found" };
      }

      const currentData = docSnap.data();
      const users = currentData.users || [];
      
      // Find the user to delete
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        return { success: false, error: "User not found" };
      }

      // Prevent admin from deleting themselves
      if (userToDelete.email === user.email) {
        return { success: false, error: "You cannot delete your own account" };
      }

      // Remove the user from the array
      const updatedUsers = users.filter(u => u.id !== userId);

      await setDoc(docRef, {
        ...currentData,
        users: updatedUsers,
        updatedAt: new Date(),
        updatedBy: user.uid
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return { success: false, error: error.message };
    }
  };

  // Action Reports Functions - Month-based structure
  const addActionReport = async (reportData) => {
    try {
      console.log('💾 Adding action report to Firestore...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }

      // Generate month key from report date
      const reportDate = new Date(reportData.when);
      const monthKey = `${String(reportDate.getMonth() + 1).padStart(2, '0')}-${reportDate.getFullYear()}`;
      
      // Generate unique report ID
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare report data with metadata
      const reportWithMetadata = {
        ...reportData,
        id: reportId,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get existing month document
      const monthDocRef = doc(db, 'actionReports', monthKey);
      const monthDocSnap = await getDoc(monthDocRef);
      
      let monthData;
      if (monthDocSnap.exists()) {
        monthData = monthDocSnap.data();
      } else {
        // Create new month document structure
        monthData = {
          monthKey: monthKey,
          totalReports: 0,
          lastUpdated: new Date().toISOString(),
          metadata: {
            year: reportDate.getFullYear(),
            month: reportDate.getMonth() + 1,
            districts: [],
            municipalities: []
          },
          data: []
        };
      }

      // Add report to data array
      monthData.data.push(reportWithMetadata);
      monthData.totalReports = monthData.data.length;
      monthData.lastUpdated = new Date().toISOString();

      // Update metadata
      if (reportData.district && !monthData.metadata.districts.includes(reportData.district)) {
        monthData.metadata.districts.push(reportData.district);
      }
      if (reportData.municipality && !monthData.metadata.municipalities.includes(reportData.municipality)) {
        monthData.metadata.municipalities.push(reportData.municipality);
      }

      // Save updated month document
      await setDoc(monthDocRef, monthData);
      
      console.log('✅ Action report saved successfully:', reportId);
      return { success: true, reportId, monthKey, reportCount: monthData.totalReports };
    } catch (error) {
      console.error('❌ Error adding action report:', error);
      return { success: false, error: error.message };
    }
  };

  const updateActionReport = async (reportId, monthKey, updateData) => {
    try {
      console.log('🔄 Updating action report:', reportId);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }

      // If monthKey is provided, try month-based structure first
      if (monthKey) {
        try {
          const monthDocRef = doc(db, 'actionReports', monthKey);
          const monthDocSnap = await getDoc(monthDocRef);
          
          if (monthDocSnap.exists()) {
            const monthData = monthDocSnap.data();
            const reportIndex = monthData.data.findIndex(report => report.id === reportId);
            
            if (reportIndex !== -1) {
              // Update the report
              monthData.data[reportIndex] = {
                ...monthData.data[reportIndex],
                ...updateData,
                updatedAt: new Date().toISOString(),
                updatedBy: user.email
              };

              monthData.lastUpdated = new Date().toISOString();

              // Save updated month document
              await setDoc(monthDocRef, monthData);
              
              console.log('✅ Action report updated in month structure:', reportId);
              return { success: true };
            }
          }
        } catch (error) {
          console.log('⚠️ Month-based update failed, trying individual document:', error.message);
        }
      }

      // Fallback: try to update as individual document (old structure)
      try {
        const reportDocRef = doc(db, 'actionReports', reportId);
        await updateDoc(reportDocRef, {
          ...updateData,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email
        });
        
        console.log('✅ Action report updated in individual document:', reportId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating individual document:', error);
        return { success: false, error: "Report not found in either structure" };
      }
    } catch (error) {
      console.error('❌ Error updating action report:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteActionReport = async (reportId, monthKey) => {
    try {
      console.log('🗑️ Deleting action report:', reportId);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }

      // If monthKey is provided, try month-based structure first
      if (monthKey) {
        try {
          const monthDocRef = doc(db, 'actionReports', monthKey);
          const monthDocSnap = await getDoc(monthDocRef);
          
          if (monthDocSnap.exists()) {
            const monthData = monthDocSnap.data();
            const reportIndex = monthData.data.findIndex(report => report.id === reportId);
            
            if (reportIndex !== -1) {
              // Remove the report from data array
              monthData.data.splice(reportIndex, 1);
              monthData.totalReports = monthData.data.length;
              monthData.lastUpdated = new Date().toISOString();

              // Save updated month document
              await setDoc(monthDocRef, monthData);
              
              console.log('✅ Action report deleted from month structure:', reportId);
              return { success: true };
            }
          }
        } catch (error) {
          console.log('⚠️ Month-based delete failed, trying individual document:', error.message);
        }
      }

      // Fallback: try to delete as individual document (old structure)
      try {
        const reportDocRef = doc(db, 'actionReports', reportId);
        await deleteDoc(reportDocRef);
        
        console.log('✅ Action report deleted from individual document:', reportId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error deleting individual document:', error);
        return { success: false, error: "Report not found in either structure" };
      }
    } catch (error) {
      console.error('❌ Error deleting action report:', error);
      return { success: false, error: error.message };
    }
  };

  const queryDocuments = async (collectionName, filters = {}) => {
    try {
      console.log('🔍 Querying documents from collection:', collectionName);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const collectionRef = collection(db, collectionName);
      let q = collectionRef;
      
      // Apply filters if provided
      if (filters.where) {
        filters.where.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }
      
      if (filters.orderBy) {
        q = query(q, orderBy(filters.orderBy.field, filters.orderBy.direction || 'asc'));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('✅ Found documents in collection:', documents.length);
      return { success: true, data: documents };
    } catch (error) {
      console.error('❌ Error querying documents:', error);
      return { success: false, error: error.message };
    }
  };

  const getActionReportsByMonth = async (monthKey) => {
    try {
      console.log('🔍 Getting action reports for month:', monthKey);
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const monthDocRef = doc(db, 'actionReports', monthKey);
      const monthDocSnap = await getDoc(monthDocRef);
      
      if (monthDocSnap.exists()) {
        const monthData = monthDocSnap.data();
        console.log('✅ Found action reports for month:', monthKey, monthData.data?.length || 0);
        return { success: true, data: monthData.data || [] };
      } else {
        console.log('📝 No action reports found for month:', monthKey);
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('❌ Error getting action reports by month:', error);
      return { success: false, error: error.message };
    }
  };

  const getAllActionReportsMonths = async () => {
    try {
      console.log('🔍 Getting all action report months...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const collectionRef = collection(db, 'actionReports');
      const querySnapshot = await getDocs(collectionRef);
      
      const months = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        months.push({
          monthKey: doc.id,
          ...data
        });
      });
      
      // Sort by month key (newest first)
      months.sort((a, b) => {
        const [aMonth, aYear] = a.monthKey.split('-').map(Number);
        const [bMonth, bYear] = b.monthKey.split('-').map(Number);
        if (aYear !== bYear) return bYear - aYear;
        return bMonth - aMonth;
      });
      
      console.log('✅ Found action report months:', months.length);
      return { success: true, data: months };
    } catch (error) {
      console.error('❌ Error getting all action report months:', error);
      return { success: false, error: error.message };
    }
  };

  const getAllActionReports = async () => {
    try {
      console.log('🔍 Getting all action reports from Firestore (hybrid approach)...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      const allReports = [];
      
      // First, try the new month-based structure
      try {
        const monthsResult = await getAllActionReportsMonths();
        if (monthsResult.success && monthsResult.data.length > 0) {
          console.log('📅 Found month-based structure with', monthsResult.data.length, 'months');
          for (const month of monthsResult.data) {
            if (month.data && Array.isArray(month.data)) {
              allReports.push(...month.data);
            }
          }
          console.log('✅ Found', allReports.length, 'reports from month-based structure');
        }
      } catch (error) {
        console.log('⚠️ Month-based structure not found or error:', error.message);
      }
      
      // If no reports found in month-based structure, try the old individual document structure
      if (allReports.length === 0) {
        console.log('🔍 Trying old individual document structure...');
        try {
          const collectionRef = collection(db, 'actionReports');
          const querySnapshot = await getDocs(collectionRef);
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Check if this is a month-based document (has 'data' array)
            if (data.data && Array.isArray(data.data)) {
              console.log('📅 Found month document:', doc.id, 'with', data.data.length, 'reports');
              allReports.push(...data.data);
            } else {
              // This is an individual action report document (old structure)
              console.log('📄 Found individual report document:', doc.id);
              allReports.push({
                id: doc.id,
                ...data
              });
            }
          });
          
          console.log('✅ Found', allReports.length, 'total reports from both structures');
        } catch (error) {
          console.error('❌ Error loading from old structure:', error);
        }
      }
      
      // Sort by creation date or when field (newest first)
      allReports.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt) : new Date(a.when || 0);
        const bDate = b.createdAt ? new Date(b.createdAt) : new Date(b.when || 0);
        return bDate - aDate;
      });
      
      console.log('✅ Found total action reports:', allReports.length);
      return { success: true, data: allReports };
    } catch (error) {
      console.error('❌ Error getting all action reports:', error);
      return { success: false, error: error.message };
    }
  };

  // Bulk delete all weekly reports from all locations
  const deleteAllWeeklyReports = async () => {
    try {
      console.log('🗑️ Starting bulk deletion of all weekly reports...');
      
      if (!db) {
        console.warn('⚠️ Firestore database not available');
        return { success: false, error: "Database not available" };
      }
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        return { success: false, error: "No user logged in" };
      }

      let deletedCount = 0;
      const errors = [];

      // 1. Delete from weeklyReports collection
      try {
        console.log('🔍 Deleting from weeklyReports collection...');
        const weeklyReportsRef = collection(db, 'weeklyReports');
        const weeklyReportsSnapshot = await getDocs(weeklyReportsRef);
        
        for (const docSnapshot of weeklyReportsSnapshot.docs) {
          try {
            await deleteDoc(doc(db, 'weeklyReports', docSnapshot.id));
            deletedCount++;
            console.log('✅ Deleted from weeklyReports collection:', docSnapshot.id);
          } catch (error) {
            console.error('❌ Error deleting from weeklyReports collection:', docSnapshot.id, error);
            errors.push(`weeklyReports/${docSnapshot.id}: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('❌ Error accessing weeklyReports collection:', error);
        errors.push(`weeklyReports collection: ${error.message}`);
      }

      // 2. Delete from commandCenter legacy structure (weeklyReports_*)
      try {
        console.log('🔍 Deleting from commandCenter legacy structure...');
        const commandCenterRef = collection(db, 'commandCenter');
        const commandCenterSnapshot = await getDocs(commandCenterRef);
        
        for (const docSnapshot of commandCenterSnapshot.docs) {
          if (docSnapshot.id.startsWith('weeklyReports_')) {
            try {
              await deleteDoc(doc(db, 'commandCenter', docSnapshot.id));
              deletedCount++;
              console.log('✅ Deleted from commandCenter legacy:', docSnapshot.id);
            } catch (error) {
              console.error('❌ Error deleting from commandCenter legacy:', docSnapshot.id, error);
              errors.push(`commandCenter/${docSnapshot.id}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error accessing commandCenter collection:', error);
        errors.push(`commandCenter collection: ${error.message}`);
      }

      // 3. Check for any other weekly report documents in commandCenter collection
      // This handles any other weekly report documents that might exist with different naming patterns
      try {
        console.log('🔍 Checking for additional weekly report documents in commandCenter...');
        const commandCenterRef = collection(db, 'commandCenter');
        const commandCenterSnapshot = await getDocs(commandCenterRef);
        
        for (const docSnapshot of commandCenterSnapshot.docs) {
          // Look for any documents that contain weekly report data but weren't caught by the weeklyReports_ pattern
          if (docSnapshot.id.includes('weekly') || docSnapshot.id.includes('Weekly')) {
            try {
              const docData = docSnapshot.data();
              // Check if this document contains weekly report data
              if (docData && (docData.weeklyReportData || docData.data)) {
                await deleteDoc(doc(db, 'commandCenter', docSnapshot.id));
                deletedCount++;
                console.log('✅ Deleted additional weekly report document:', docSnapshot.id);
              }
            } catch (error) {
              console.error('❌ Error deleting additional weekly report document:', docSnapshot.id, error);
              errors.push(`commandCenter/${docSnapshot.id}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking for additional weekly report documents:', error);
        errors.push(`Additional documents check: ${error.message}`);
      }

      console.log(`✅ Bulk deletion completed. Deleted ${deletedCount} documents.`);
      
      if (errors.length > 0) {
        console.warn('⚠️ Some deletions failed:', errors);
        return { 
          success: true, 
          deletedCount, 
          errors,
          message: `Deleted ${deletedCount} documents with ${errors.length} errors` 
        };
      }
      
      return { 
        success: true, 
        deletedCount,
        message: `Successfully deleted all ${deletedCount} weekly reports` 
      };
    } catch (error) {
      console.error('❌ Error in bulk deletion:', error);
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
    saveWeeklyReportToCollection,
    saveWeeklyReportByMunicipality,
    getWeeklyReportsFromCollection,
    updateWeeklyReportInCollection,
    deleteWeeklyReportFromCollection,
    deleteAllWeeklyReports,
    createUserByAdmin,
    updateUser,
    deleteUser,
    getUsers,
    addActionReport,
    updateActionReport,
    deleteActionReport,
    queryDocuments,
    getActionReportsByMonth,
    getAllActionReportsMonths,
    getAllActionReports
  };
};