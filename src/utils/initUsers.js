// Utility to initialize users collection in Firestore
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Initialize default users in Firestore
export const initializeUsers = async () => {
  try {
    console.log('🔧 Initializing users collection in Firestore...');
    
    if (!db) {
      console.warn('⚠️ Firestore database not available');
      return { success: false, error: "Database not available" };
    }
    
    const docRef = doc(db, 'users', 'management');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('📝 Creating initial users document...');
      
      const defaultUsers = [
        {
          id: 1,
          name: "Administrator",
          email: "admin@ipatroller.gov.ph",
          role: "Admin",
          status: "Active",
          district: "ALL DISTRICTS",
          createdAt: new Date().toISOString(),
          createdBy: "system"
        }
      ];
      
      await setDoc(docRef, {
        users: defaultUsers,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: "system"
      });
      
      console.log('✅ Initial users document created successfully');
      return { success: true, data: defaultUsers };
    } else {
      console.log('✅ Users document already exists');
      const existingUsers = docSnap.data().users || [];
      return { success: true, data: existingUsers };
    }
  } catch (error) {
    console.error('❌ Error initializing users:', error);
    return { success: false, error: error.message };
  }
};

// Check if users collection exists and is accessible
export const checkUsersCollection = async () => {
  try {
    console.log('🔍 Checking users collection...');
    
    if (!db) {
      return { success: false, error: "Database not available" };
    }
    
    const docRef = doc(db, 'users', 'management');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const users = docSnap.data().users || [];
      console.log('✅ Users collection accessible, found', users.length, 'users');
      return { success: true, data: users };
    } else {
      console.log('📝 Users collection does not exist');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('❌ Error checking users collection:', error);
    return { success: false, error: error.message };
  }
};

// Create a test user for development
export const createTestUser = async (email, password) => {
  try {
    console.log('🧪 Creating test user:', email);
    
    const testUser = {
      id: Date.now(),
      name: email.split('@')[0],
      email: email,
      role: "User",
      status: "Active",
      district: "ALL DISTRICTS",
      createdAt: new Date().toISOString(),
      createdBy: "system"
    };
    
    // This would need to be called from a component that has access to addUser
    return { success: true, data: testUser };
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return { success: false, error: error.message };
  }
};
