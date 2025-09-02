import { useState, useEffect } from 'react';

// Simple authentication hook to replace Firebase auth
export const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password, keepLoggedIn = false) => {
    setLoading(true);
    
    // Simple authentication - you can modify these credentials
    if (email === 'admin@ipatroller.com' && password === 'admin123') {
      const userData = {
        uid: '1',
        email: email,
        displayName: 'Admin User'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setLoading(false);
      return { success: true, user: userData };
    } else {
      setLoading(false);
      return { success: false, error: 'Invalid credentials. Use admin@ipatroller.com / admin123' };
    }
  };

  const signUp = async (email, password, displayName) => {
    // For now, just use sign in
    return await signIn(email, password, true);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    return { success: true };
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