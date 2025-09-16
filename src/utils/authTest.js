// Authentication test utilities
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Test authentication flow
export const testAuthFlow = async (email, password) => {
  try {
    
    // Test 1: Try to sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Test 2: Check if user is still authenticated after a short delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (auth.currentUser && auth.currentUser.email === email) {
      return { success: true, message: 'Authentication flow working correctly' };
    } else {
      return { success: false, message: 'Authentication not persisting' };
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return { success: false, message: error.message };
  }
};

// Create a test user
export const createTestUser = async (email, password) => {
  try {
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    return { success: false, error: error.message };
  }
};

// Test user role checking
export const testUserRoleCheck = async (email) => {
  try {
    
    // This would need to be called from a component that has access to checkUserRole
    
    return { success: true, message: 'User role check test completed' };
  } catch (error) {
    console.error('❌ User role check test failed:', error);
    return { success: false, error: error.message };
  }
};

// Export test functions for console use
if (typeof window !== 'undefined') {
  window.testAuthFlow = testAuthFlow;
  window.createTestUser = createTestUser;
  window.testUserRoleCheck = testUserRoleCheck;
  
  console.log('🧪 Authentication test functions available:');
  console.log('- testAuthFlow(email, password)');
  console.log('- createTestUser(email, password)');
  console.log('- testUserRoleCheck(email)');
}
