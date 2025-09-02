import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';
import { auth } from '../firebase';

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
    // Always return true since we're not using Firestore
    return true;
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