import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Initialize Firestore with admin user
export const initializeFirestore = async () => {
  try {
    console.log('🔧 Initializing Firestore database...');
    
    // Create the users collection with admin user
    const adminUser = {
      id: 1,
      name: "Administrator",
      email: "admin@ipatroller.gov.ph",
      role: "Admin",
      status: "Active",
      lastLogin: new Date().toISOString(),
      district: "ALL DISTRICTS",
      createdAt: new Date().toISOString(),
      createdBy: "system"
    };

    const usersData = {
      users: [adminUser],
      updatedAt: new Date().toISOString(),
      updatedBy: "system"
    };

    // Save to Firestore
    const docRef = doc(db, 'users', 'management');
    await setDoc(docRef, usersData);
    
    console.log('✅ Firestore initialized with admin user');
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    return { success: false, error: error.message };
  }
};

// Test function to check if admin user exists
export const checkAdminUser = async () => {
  try {
    const { getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'users', 'management');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const adminUser = data.users?.find(u => u.email === "admin@ipatroller.gov.ph");
      return { success: true, exists: !!adminUser, data: adminUser };
    } else {
      return { success: true, exists: false };
    }
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    return { success: false, error: error.message };
  }
}; 