import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IPatroller from "./pages/IPatroller";
import Reports from "./pages/Reports";
import IncidentsReports from "./pages/IncidentsReports";
import ActionCenter from "./pages/ActionCenter";
import CommandCenter from "./pages/CommandCenter";
import Settings from "./pages/Settings";
import FirestoreTest from "./tests/FirestoreTest";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
// Firebase-related components removed

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

  // Set initial page after auth is determined; force all non-admin users to their respective pages
  useEffect(() => {
    if (!loading && !authLoading && user) {
      // Only proceed if we have a user and Firebase auth is ready
      if (!isAdmin && userAccessLevel) {
        // Set the appropriate page for non-admin users based on access level
        if (userAccessLevel === 'command-center') {
          setCurrentPage('commandcenter');
          window.history.replaceState({}, '', '/commandcenter');
        } else if (userAccessLevel === 'action-center') {
          setCurrentPage('actioncenter');
          window.history.replaceState({}, '', '/actioncenter');
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
      }
      // If userAccessLevel is not yet loaded, keep current page as 'loading'
    } else if (!loading && !user) {
      // User is not logged in, ensure URL is root
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      setCurrentPage('loading');
    }
  }, [user, loading, userAccessLevel, userViewingPage, isAdmin]);

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
      } else if (userAccessLevel === 'action-center') {
        setCurrentPage('actioncenter');
        window.history.replaceState({}, '', '/actioncenter');
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
  }, [user, loading, userAccessLevel, userViewingPage, isAdmin, currentPage]);

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
  useEffect(() => {
    if (!user || loading) return;
    
    const fullName = `${userFirstName || ''} ${userLastName || ''}`.trim() || userUsername || user.email;

    // Initial connection
    updateUserPresence(user.email, 'online', { fullName });
    setLocalPresence('online');

    let idleTimer;
    let throttleTimer;
    const idleTimeout = 1 * 60 * 1000; // 1 minute timeout for idle status
    
    const setIdle = () => {
      setLocalPresence('idle');
      updateUserPresence(user.email, 'idle', { fullName });
    };

    const resetActivity = () => {
      if (localPresence === 'idle' || localPresence === 'offline') {
        setLocalPresence('online');
        updateUserPresence(user.email, 'online', { fullName });
      }
      
      clearTimeout(idleTimer);
      idleTimer = setTimeout(setIdle, idleTimeout);
      
      // Throttle pings to avoid hammering DB
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          updateUserPresence(user.email, 'online', { fullName });
          throttleTimer = null;
        }, 60000); // Max 1 active ping per minute
      }
    };

    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('click', resetActivity);
    window.addEventListener('scroll', resetActivity);
    
    // Initial start
    idleTimer = setTimeout(setIdle, idleTimeout);

    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      clearTimeout(idleTimer);
      clearTimeout(throttleTimer);
    };
  }, [user, loading, localPresence, updateUserPresence]);

  // Set offline strictly if browser unloads
  useEffect(() => {
    const handleUnload = () => {
      if (user && user.email) {
        updateUserPresence(user.email, 'offline');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user, updateUserPresence]);

  // Admin Notification: Watch for login, idle, and logout events
  const prevPresenceRef = React.useRef({});
  const isInitialLoadRef = React.useRef(true);

  useEffect(() => {
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
            toast.success(`User Connected`, {
              description: `User ${name} has logged into the system.`,
              duration: 5000,
              action: {
                label: 'Clear All',
                onClick: () => toast.dismiss()
              }
            });
          } else if (pStatus === 'online' && data.status === 'idle') {
            toast.warning(`User Idle Alert`, {
              description: `User ${name} has become idle and is no longer moving.`,
              duration: 5000,
              action: {
                label: 'Clear All',
                onClick: () => toast.dismiss()
              }
            });
          } else if (pStatus && pStatus !== 'offline' && data.status === 'offline') {
            toast.error(`User Disconnected`, {
              description: `User ${name} has securely logged out of the system.`,
              duration: 5000,
              action: {
                label: 'Clear All',
                onClick: () => toast.dismiss()
              }
            });
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
      if (isAdmin || userAccessLevel === 'admin') {
        await logAdminLogout(userInfo);
      } else {
        await logUserLogout(userInfo);
      }
      
      // First, call Firebase logout to clear authentication
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
    // Show loading spinner while in loading state
    if (currentPage === 'loading' && user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
          {/* Ethereal Light Background Glows */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[100px] opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* WHITE THEME ATOMIC SPINNER */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">
              
              {/* Nucleus (Bataan Logo) - White Glassmorphism */}
              <div className="relative z-20 w-32 h-32 p-4 bg-white/40 backdrop-blur-xl rounded-full border border-white shadow-[0_8px_32px_rgba(37,99,235,0.1)] animate-pulse flex items-center justify-center">
                <img 
                  src="/images/Ipatroller_Logo.png"
                  alt="Bataan Logo"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Orbit 1 - Blue */}
              <div className="absolute w-full h-[80px] border-[2px] border-blue-500/20 rounded-[100%] rotate-x-60 animate-orbit-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full shadow-[0_0_12px_#3B82F6]"></div>
              </div>

              {/* Orbit 2 - Purple */}
              <div className="absolute w-full h-[80px] border-[2px] border-purple-500/20 rounded-[100%] rotate-[60deg] rotate-x-60 animate-orbit-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-purple-500 rounded-full shadow-[0_0_12px_#A855F7]"></div>
              </div>

              {/* Orbit 3 - Emerald/Teal */}
              <div className="absolute w-full h-[80px] border-[2px] border-emerald-500/20 rounded-[100%] rotate-[-60deg] rotate-x-60 animate-orbit-3">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_12px_#10B981]"></div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-800 mb-3 uppercase drop-shadow-sm">
                Verifying <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Access</span>
              </h2>
              <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/60 transition-transform hover:scale-105 duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.25em]">Atomic Sync Protocol</p>
              </div>
            </div>
            
            <p className="mt-16 text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] italic opacity-80">Provincial Government of Bataan</p>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .rotate-x-60 { transform: rotateX(60deg); }
            @keyframes orbit-1 {
              from { transform: rotateX(65deg) rotate(0deg); }
              to { transform: rotateX(65deg) rotate(360deg); }
            }
            @keyframes orbit-2 {
              from { transform: rotateX(65deg) rotate(60deg) rotate(0deg); }
              to { transform: rotateX(65deg) rotate(60deg) rotate(360deg); }
            }
            @keyframes orbit-3 {
              from { transform: rotateX(65deg) rotate(-60deg) rotate(0deg); }
              to { transform: rotateX(65deg) rotate(-60deg) rotate(360deg); }
            }
            .animate-orbit-1 { animation: orbit-1 3.5s infinite linear; }
            .animate-orbit-2 { animation: orbit-2 4.5s infinite linear; }
            .animate-orbit-3 { animation: orbit-3 5.5s infinite linear; }
          `}} />
        </div>
      );
    }

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
        case 'actioncenter':
          return <ActionCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
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
      } else if (userAccessLevel === 'action-center') {
        setCurrentPage('actioncenter');
        return <ActionCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'ipatroller') {
        setCurrentPage('ipatroller');
        return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'incidents') {
        setCurrentPage('incidents');
        return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      }
    }

    // Access control for settings - all non-admin users cannot access settings
    if (currentPage === 'settings' && !isAdmin) {
      if (userAccessLevel === 'command-center') {
        setCurrentPage('commandcenter');
        return <CommandCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'action-center') {
        setCurrentPage('actioncenter');
        return <ActionCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'ipatroller') {
        setCurrentPage('ipatroller');
        return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      } else if (userAccessLevel === 'incidents') {
        setCurrentPage('incidents');
        return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      }
    }


    switch (currentPage) {
      case 'loading':
        return null; // Should be handled by the if(currentPage==='loading') above, but for safety
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
      case 'actioncenter':
        return <ActionCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
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
          } else if (userAccessLevel === 'action-center') {
            setCurrentPage('actioncenter');
            return <ActionCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
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

  // Show loading spinner only while Firebase is initializing (not logged in yet)
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
        {/* Ethereal Light Background Glows */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[100px] opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* WHITE THEME ATOMIC SPINNER */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-12">
            
            {/* Nucleus (Bataan Logo) - White Glassmorphism */}
            <div className="relative z-20 w-32 h-32 p-4 bg-white/40 backdrop-blur-xl rounded-full border border-white shadow-[0_8px_32px_rgba(37,99,235,0.1)] animate-pulse flex items-center justify-center">
              <img 
                src="/images/Ipatroller_Logo.png"
                alt="Bataan Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Orbit 1 - Blue */}
            <div className="absolute w-full h-[80px] border-[2px] border-blue-500/20 rounded-[100%] rotate-x-60 animate-orbit-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full shadow-[0_0_12px_#3B82F6]"></div>
            </div>

            {/* Orbit 2 - Purple */}
            <div className="absolute w-full h-[80px] border-[2px] border-purple-500/20 rounded-[100%] rotate-[60deg] rotate-x-60 animate-orbit-2">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-purple-500 rounded-full shadow-[0_0_12px_#A855F7]"></div>
            </div>

            {/* Orbit 3 - Emerald/Teal */}
            <div className="absolute w-full h-[80px] border-[2px] border-emerald-500/20 rounded-[100%] rotate-[-60deg] rotate-x-60 animate-orbit-3">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_12px_#10B981]"></div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-800 mb-3 uppercase drop-shadow-sm">
              Initializing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">System</span>
            </h2>
            <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/60 transition-transform hover:scale-105 duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.25em]">Atomic Sync Protocol</p>
            </div>
          </div>
          
          <p className="mt-16 text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] italic opacity-80">Provincial Government of Bataan</p>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          .rotate-x-60 { transform: rotateX(60deg); }
          @keyframes orbit-1 {
            from { transform: rotateX(65deg) rotate(0deg); }
            to { transform: rotateX(65deg) rotate(360deg); }
          }
          @keyframes orbit-2 {
            from { transform: rotateX(65deg) rotate(60deg) rotate(0deg); }
            to { transform: rotateX(65deg) rotate(60deg) rotate(360deg); }
          }
          @keyframes orbit-3 {
            from { transform: rotateX(65deg) rotate(-60deg) rotate(0deg); }
            to { transform: rotateX(65deg) rotate(-60deg) rotate(360deg); }
          }
          .animate-orbit-1 { animation: orbit-1 3.5s infinite linear; }
          .animate-orbit-2 { animation: orbit-2 4.5s infinite linear; }
          .animate-orbit-3 { animation: orbit-3 5.5s infinite linear; }
        `}} />
      </div>
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
