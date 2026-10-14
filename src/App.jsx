import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IPatroller from "./pages/IPatroller";
import Reports from "./pages/Reports";
import IncidentsReports from "./pages/IncidentsReports";
import CommandCenter from "./pages/CommandCenter";
import Settings from "./pages/Settings";
import FirestoreTest from "./tests/FirestoreTest";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import LoadingScreen from "./components/LoadingScreen";

import { PatrolDataProvider } from "./contexts/PatrolDataContext";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useFirebase } from "./hooks/useFirebase";
import { getCurrentPageFromURL, handleBrowserNavigation, syncURLWithPage } from "./utils/routeUtils";
import { initializeUsers } from "./utils/initUsers";
import "./utils/consoleHelpers"; // Load console helper functions
import "./utils/authTest"; // Load authentication test functions
import { db } from "./lib/firebase"; // Initialize Firebase
import { collection, onSnapshot } from "firebase/firestore";
import "./styles/mobile.css"; // Mobile responsive styles
import { Toaster, toast } from "sonner";
import { logPageNavigation, logAdminLogout, logAdminLogin } from './utils/adminLogger';
import { logPageNavigation as logUserNavigation, logUserLogout, logUserLogin } from './utils/universalLogger';

// Component that has access to AuthContext
function AppContent() {
  const [currentPage, setCurrentPage] = useState('loading');
  const [hasLoggedLogin, setHasLoggedLogin] = useState(false);
  const [localPresence, setLocalPresence] = useState('offline');
  const { user, loading, logout, updateUserPresence } = useFirebase();
  const { isAdmin, userAccessLevel, userViewingPage, userFirstName, userLastName, userUsername, userMunicipality, userDepartment, loading: authLoading } = useAuth();

  // Monitor Firestore quota errors (Admin only)
  useEffect(() => {
    if (!isAdmin) return;

    const handleFirestoreError = (event) => {
      // Check if it's a Firestore quota error
      if (event.message && event.message.includes('resource-exhausted')) {
        // Calculate next reset time (midnight Pacific Time)
        const now = new Date();
        const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        const tomorrow = new Date(pacificTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        // Convert to Philippine Time for display
        const resetTimePHT = new Date(tomorrow.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        const resetDateStr = resetTimePHT.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric',
          timeZone: 'Asia/Manila'
        });
        const resetTimeStr = resetTimePHT.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila'
        });
        
        // Show toast notification
        toast.error(
          <div className="flex flex-col gap-2 w-full">
            <p className="font-bold text-red-800">⚠️ Firestore Quota Exceeded</p>
            <p className="text-xs text-red-700">
              Your Firestore daily quota has been exceeded. Some features may not work until the quota resets.
            </p>
            <div className="flex flex-col gap-1 text-xs text-red-600 mt-1">
              <p className="font-semibold">Quota resets at:</p>
              <p className="font-bold text-red-700">{resetDateStr} at {resetTimeStr}</p>
              <p className="mt-1 opacity-80">(Philippine Time - Midnight Pacific Time)</p>
            </div>
            <div className="flex flex-col gap-1 text-xs text-red-600 mt-2">
              <p>• Real-time updates are paused</p>
              <p>• Data writes may fail</p>
              <p>• Consider upgrading to Blaze plan</p>
            </div>
            <button 
              onClick={() => toast.dismiss()}
              className="mt-2 text-[10px] uppercase font-black tracking-widest bg-red-600 text-white py-1.5 px-3 rounded-lg hover:bg-red-700 transition-colors self-start"
            >
              Dismiss
            </button>
          </div>,
          { 
            duration: Infinity, // Keep it visible
            id: 'quota-exceeded' // Prevent duplicates
          }
        );
      }
    };

    // Listen for console errors
    const originalError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('resource-exhausted') || message.includes('Quota exceeded')) {
        handleFirestoreError({ message });
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, [isAdmin]);

  // Set initial page after auth is determined; force all non-admin users to their respective pages
  useEffect(() => {
    if (!loading && !authLoading && user) {
      // Only proceed if we have a user and Firebase auth is ready
      if (!isAdmin && userAccessLevel) {
        // Set the appropriate page for non-admin users based on access level
        if (userAccessLevel === 'command-center') {
          setCurrentPage('commandcenter');
          window.history.replaceState({}, '', '/commandcenter');
        } else if (userAccessLevel === 'ipatroller') {
          setCurrentPage('ipatroller');
          window.history.replaceState({}, '', '/ipatroller');
        } else if (userAccessLevel === 'incidents') {
          setCurrentPage('incidents');
          window.history.replaceState({}, '', '/incidents');
        } else if (userAccessLevel === 'viewing') {
          const page = userViewingPage || 'dashboard';
          setCurrentPage(page);
          window.history.replaceState({}, '', `/${page}`);
        } else {
          // Fallback to dashboard if no specific access level (shouldn't happen)
          setCurrentPage('dashboard');
        }
      } else if (isAdmin) {
        // Admin users can access any page, default to dashboard or URL
        const pageFromURL = getCurrentPageFromURL();
        setCurrentPage(pageFromURL || 'dashboard');
      } else if (!isAdmin && !userAccessLevel) {
        // Fallback for non-admin without specific access level
        setCurrentPage('dashboard');
      }
    } else if (!loading && !user) {
      // User is not logged in, ensure URL is root
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      setCurrentPage('login');
    }
  }, [user, loading, authLoading, userAccessLevel, userViewingPage, isAdmin]);

  // Initialize users collection when app starts
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        await initializeUsers();
        console.log('✅ App initialization completed');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };
    
    initApp();
  }, []);

  // Immediately route all non-admin users to their respective pages after login
  useEffect(() => {
    if (user && !loading && !authLoading && !isAdmin && userAccessLevel && currentPage === 'loading') {
      // Only redirect if we're still in loading state and have access level
      if (userAccessLevel === 'command-center') {
        setCurrentPage('commandcenter');
        window.history.replaceState({}, '', '/commandcenter');
      } else if (userAccessLevel === 'ipatroller') {
        setCurrentPage('ipatroller');
        window.history.replaceState({}, '', '/ipatroller');
      } else if (userAccessLevel === 'incidents') {
        setCurrentPage('incidents');
        window.history.replaceState({}, '', '/incidents');
      } else if (userAccessLevel === 'viewing') {
        const page = userViewingPage || 'dashboard';
        setCurrentPage(page);
        window.history.replaceState({}, '', `/${page}`);
      }
    }
  }, [user, loading, authLoading, userAccessLevel, userViewingPage, isAdmin, currentPage]);

  // Log user logins successfully
  useEffect(() => {
    if (user && !loading && !authLoading && userAccessLevel && !hasLoggedLogin) {
      const userInfo = {
        email: user.email || '',
        firstName: userFirstName,
        lastName: userLastName,
        username: userUsername,
        accessLevel: userAccessLevel,
        municipality: userMunicipality,
        department: userDepartment,
        isAdmin: isAdmin
      };
      if (isAdmin || userAccessLevel === 'admin') {
        logAdminLogin(userInfo);
      } else {
        logUserLogin(userInfo);
      }
      setHasLoggedLogin(true);
    }
    
    // Reset when logged out
    if (!user && !loading && hasLoggedLogin) {
      setHasLoggedLogin(false);
    }
  }, [user, loading, authLoading, userAccessLevel, isAdmin, hasLoggedLogin, userFirstName, userLastName, userUsername, userMunicipality, userDepartment]);

  // Track global user presence (online/idle) based on window activity
  // OPTIMIZED: Reduced writes to save Firestore quota
  useEffect(() => {
    if (!user || loading) return;
    
    const fullName = `${userFirstName || ''} ${userLastName || ''}`.trim() || userUsername || user.email;

    // Initial connection - only write once on mount
    updateUserPresence(user.email, 'online', { fullName });
    setLocalPresence('online');

    let idleTimer;
    let lastActivityTime = Date.now();
    let lastWriteTime = Date.now();
    const idleTimeout = 5 * 60 * 1000; // 5 minutes timeout for idle status
    const writeThrottle = 3 * 60 * 1000; // Only write every 3 minutes max
    
    const setIdle = () => {
      if (localPresence !== 'idle') {
        setLocalPresence('idle');
        updateUserPresence(user.email, 'idle', { fullName });
        lastWriteTime = Date.now();
      }
    };

    const resetActivity = () => {
      const now = Date.now();
      lastActivityTime = now;
      
      // Only update if transitioning from idle/offline to online
      if (localPresence === 'idle' || localPresence === 'offline') {
        setLocalPresence('online');
        updateUserPresence(user.email, 'online', { fullName });
        lastWriteTime = now;
      } 
      // Or if enough time has passed since last write (heartbeat)
      else if (now - lastWriteTime > writeThrottle) {
        updateUserPresence(user.email, 'online', { fullName });
        lastWriteTime = now;
      }
      
      clearTimeout(idleTimer);
      idleTimer = setTimeout(setIdle, idleTimeout);
    };

    // Use passive listeners for better performance
    const options = { passive: true };
    window.addEventListener('mousemove', resetActivity, options);
    window.addEventListener('keydown', resetActivity, options);
    window.addEventListener('click', resetActivity, options);
    window.addEventListener('scroll', resetActivity, options);
    
    // Initial start
    idleTimer = setTimeout(setIdle, idleTimeout);

    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      clearTimeout(idleTimer);
    };
  }, [user, loading, localPresence, updateUserPresence, userFirstName, userLastName, userUsername]);

  // Set offline strictly if browser unloads
  useEffect(() => {
    const handleUnload = () => {
      if (user && user.email) {
        updateUserPresence(user.email, 'offline', { presenceReason: 'unload' });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user, updateUserPresence]);

  // Admin Notification: Watch for login, idle, and logout events
  // DISABLED TO SAVE FIRESTORE QUOTA - This was causing excessive reads
  const prevPresenceRef = React.useRef({});
  const isInitialLoadRef = React.useRef(true);

  useEffect(() => {
    // DISABLED: Admin notifications for user presence changes
    // This feature was consuming too many Firestore reads
    // To re-enable, uncomment the code below
    
    /*
    if (!isAdmin) return;
    
    const presenceRef = collection(db, 'userPresence');
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      // Determine if this is the very first read
      const isInitial = isInitialLoadRef.current;
      if (isInitial) {
        isInitialLoadRef.current = false;
      }

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const pStatus = prevPresenceRef.current[change.doc.id];
        const name = data.fullName || change.doc.id;

        if (!isInitial) {
          // Detect state transitions for real-time notifications
          if ((!pStatus || pStatus === 'offline') && data.status === 'online') {
            toast.success(
              <div className="flex flex-col gap-1 w-full">
                <p className="font-bold">User Connected</p>
                <p className="text-xs opacity-90">User {name} has logged into the system.</p>
                <button 
                  onClick={() => toast.dismiss()}
                  className="mt-2 text-[10px] uppercase font-black tracking-widest bg-emerald-600 text-white py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition-colors self-start"
                >
                  Clear All Notifications
                </button>
              </div>,
              { duration: 5000 }
            );
          } else if (pStatus && pStatus !== 'offline' && data.status === 'offline' && data.presenceReason === 'logout') {
            toast.error(
              <div className="flex flex-col gap-1 w-full">
                <p className="font-bold text-rose-800">User Disconnected</p>
                <p className="text-xs text-rose-700">User {name} has securely logged out of the system.</p>
                <button 
                  onClick={() => toast.dismiss()}
                  className="mt-2 text-[10px] uppercase font-black tracking-widest bg-rose-600 text-white py-1.5 px-3 rounded-lg hover:bg-rose-700 transition-colors self-start"
                >
                  Clear All Notifications
                </button>
              </div>,
              { duration: 5000 }
            );
          }
        }
        
        // Always store latest status
        prevPresenceRef.current[change.doc.id] = data.status;
      });
    });

    return () => {
      unsubscribe();
      isInitialLoadRef.current = true; // reset barrier when unmounted
    };
    */
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      console.log('🚪 Logout initiated...');
      console.log('👤 Current user before logout:', user?.email);
      
      const userInfo = {
        email: user?.email || '',
        firstName: userFirstName,
        lastName: userLastName,
        username: userUsername,
        accessLevel: userAccessLevel,
        municipality: userMunicipality,
        department: userDepartment,
        isAdmin: isAdmin
      };
      
      // Log logout event before calling logout
      try {
        if (isAdmin || userAccessLevel === 'admin') {
          await Promise.race([
            logAdminLogout(userInfo),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Logout logging timeout')), 2000))
          ]);
        } else {
          await Promise.race([
            logUserLogout(userInfo),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Logout logging timeout')), 2000))
          ]);
        }
      } catch (logError) {
        console.warn('⚠️ Logout logging failed or timed out:', logError);
        // Continue with logout even if logging fails
      }
      
      // Call Firebase logout (this handles presence update internally)
      await logout();
      console.log('✅ Firebase logout completed');
      
      // Add a small delay to ensure Firebase auth state change is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('⏳ Delay completed');
      
      // Clear any stored data or state if needed
      console.log('🧹 Local storage cleared');
      
      // Reset to loading page (this will be overridden by the user state change)
      setCurrentPage('loading');
      console.log('📄 Page reset to loading');
      
      console.log('🎯 Logout completed - waiting for auth state change...');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if Firebase logout fails, still try to redirect
      setCurrentPage('loading');
    }
  };

  const handleNavigate = async (page) => {
    const previousPage = currentPage;
    setCurrentPage(page);
    
    // Note: Page navigation tracking has been disabled to prevent database spam
    // and to clean up the System Logs overview.
    
    // Use utility function to update URL
    window.history.replaceState({}, '', `/${page}`);
  };

  // Listen for browser back/forward buttons and URL changes using utility function, but only when logged in
  useEffect(() => {
    if (user) {
      const cleanup = handleBrowserNavigation(setCurrentPage);
      return cleanup;
    }
  }, [user]);

  // Ensure URL is always in sync with current page, but only when user is logged in
  useEffect(() => {
    if (user) {
      syncURLWithPage(currentPage);
    } else {
      // When user is not logged in, set URL to root
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [currentPage, user]);

  const renderPage = () => {
    // Access control for viewing users: force them onto the allowed page
    if (!isAdmin && userAccessLevel === 'viewing') {
      const allowed = userViewingPage || 'dashboard';
      if (currentPage !== allowed) {
        setCurrentPage(allowed);
      }
      switch (allowed) {
        case 'ipatroller':
          return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
        case 'commandcenter':
          return <CommandCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
        case 'incidents':
          return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
        case 'dashboard':
        default:
          return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      }
    }

    // Access control for dashboard - all non-admin users cannot access dashboard
    if (currentPage === 'dashboard' && !isAdmin) {
      // Redirect all non-admin users to their respective pages based on access level
      if (userAccessLevel === 'command-center') {
        setCurrentPage('commandcenter');
        return <CommandCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'ipatroller') {
        setCurrentPage('ipatroller');
        return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'incidents') {
        setCurrentPage('incidents');
        return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      }
    }

    // Access control for settings - only admin and ipatroller users can access settings
    if (currentPage === 'settings' && !isAdmin && userAccessLevel !== 'ipatroller') {
      if (userAccessLevel === 'command-center') {
        setCurrentPage('commandcenter');
        return <CommandCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'incidents') {
        setCurrentPage('incidents');
        return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      }
    }


    switch (currentPage) {
      case 'loading':
        return <LoadingScreen />;
      case 'dashboard':
        return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'ipatroller':
        return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'commandcenter':
        return <CommandCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'reports':
        return <Reports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'incidents':
        return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'settings':
        return <Settings onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'users':
        return <Users onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'logs':
        return <Logs onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'firestoretest':
        return <FirestoreTest onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      // Firebase test routes removed
      default:
        // For default case, also check access control for all non-admin users
        if (!isAdmin) {
          if (userAccessLevel === 'command-center') {
            setCurrentPage('commandcenter');
            return <CommandCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
          } else if (userAccessLevel === 'ipatroller') {
            setCurrentPage('ipatroller');
            return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
          } else if (userAccessLevel === 'incidents') {
            setCurrentPage('incidents');
            return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
          }
        }
        return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
    }
  };

  // Show single unified loading screen until auth & destination page are resolved
  const isAppLoading = loading || (user && (authLoading || currentPage === 'loading'));

  if (isAppLoading) {
    return (
      <>
        <LoadingScreen />
        <Toaster position="top-right" richColors closeButton />
      </>
    );
  }

  return (
    <PatrolDataProvider>
      <DataProvider>
        <div className="App">
          {user ? renderPage() : <Login onLogin={() => {}} />}
          <Toaster position="top-right" richColors closeButton />
        </div>
      </DataProvider>
    </PatrolDataProvider>
  );
}

// Main App component that provides AuthContext
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
