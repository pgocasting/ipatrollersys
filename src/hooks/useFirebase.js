import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user's last login time
      if (db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            lastLogin: new Date().toISOString(),
            email: user.email,
            displayName: user.displayName || email
          }, { merge: true });
        } catch (error) {
          console.warn('⚠️ Could not update user login time:', error.message);
        }
      }

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
    } finally {
      setLoading(false);
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

  const waitForFirestoreReady = async () => {
    if (!db) {
      console.warn('⚠️ Firestore not initialized');
      return false;
    }
    
    try {
      // Test connection with a simple operation
      const testDoc = doc(db, '_test_connection', 'test');
      await getDoc(testDoc);
      return true;
    } catch (error) {
      if (error.code === 'permission-denied') {
        // This is normal for new projects
        return true;
      }
      console.warn('⚠️ Firestore not ready:', error.message);
      return false;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    waitForFirestoreReady
  };
}; 