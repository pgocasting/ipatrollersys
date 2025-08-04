import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Create a new user in Firebase Authentication
export const createFirebaseUser = async (email, password, displayName = null) => {
  try {
    console.log('🔧 Creating Firebase user:', email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await userCredential.user.updateProfile({ displayName });
    }
    
    console.log('✅ Firebase user created successfully:', userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Error creating Firebase user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'User already exists in Firebase Authentication' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email format' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password is too weak (minimum 6 characters)' };
    } else {
      return { success: false, error: error.message };
    }
  }
};

// Test Firebase Authentication login
export const testFirebaseLogin = async (email, password) => {
  try {
    console.log('🔧 Testing Firebase login:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Firebase login successful:', userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Firebase login failed:', error);
    
    if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'User not found in Firebase Authentication' };
    } else if (error.code === 'auth/wrong-password') {
      return { success: false, error: 'Incorrect password' };
    } else if (error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Invalid email or password' };
    } else if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Too many failed attempts. Try again later' };
    } else {
      return { success: false, error: error.message };
    }
  }
};

// Create default admin user
export const createDefaultAdmin = async () => {
  try {
    console.log('🔧 Creating default admin user...');
    
    const result = await createFirebaseUser(
      'admin@ipatroller.gov.ph',
      'admin123456',
      'Administrator'
    );
    
    if (result.success) {
      console.log('✅ Default admin user created');
      return result;
    } else {
      console.log('ℹ️ Admin user may already exist:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    return { success: false, error: error.message };
  }
}; 