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
// Firebase-related components removed

import { PatrolDataProvider } from "./contexts/PatrolDataContext";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useFirebase } from "./hooks/useFirebase";
import { getCurrentPageFromURL, handleBrowserNavigation, syncURLWithPage } from "./utils/routeUtils";
import { initializeUsers } from "./utils/initUsers";
import "./utils/consoleHelpers"; // Load console helper functions
import "./utils/authTest"; // Load authentication test functions
import "./lib/firebase"; // Initialize Firebase
import "./styles/mobile.css"; // Mobile responsive styles
import { Toaster } from "sonner";
import { logPageNavigation, logAdminLogout } from './utils/adminLogger';

// Component that has access to AuthContext
function AppContent() {
  const [currentPage, setCurrentPage] = useState('loading');
  const { user, loading, logout } = useFirebase();
  const { isAdmin, userAccessLevel, userViewingPage, userFirstName, userLastName, userUsername, userMunicipality, userDepartment } = useAuth();

  // Set initial page after auth is determined; force all non-admin users to their respective pages
  useEffect(() => {
    if (!loading && user) {
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
    if (user && !loading && !isAdmin && userAccessLevel && currentPage === 'loading') {
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

  const handleLogout = async () => {
    try {
      console.log('🚪 Logout initiated...');
      console.log('👤 Current user before logout:', user?.email);
      
      // Log admin logout before logging out
      if (isAdmin || userAccessLevel === 'admin') {
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
        await logAdminLogout(userInfo);
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
    
    // Log page navigation for administrators
    if (isAdmin || userAccessLevel === 'admin') {
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
      await logPageNavigation(previousPage, page, userInfo);
    }
    
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
    // Show loading spinner only if we don't have user access level yet
    if (currentPage === 'loading' && user && !userAccessLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050B18] overflow-hidden">
          {/* Futuristic Background Glows */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* ATOMIC SPINNER CONTAINER */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">
              
              {/* Nucleus (Bataan Logo) */}
              <div className="relative z-20 w-32 h-32 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.3)] animate-pulse flex items-center justify-center">
                <img 
                  src="/images/Ipatroller_Logo.png"
                  alt="Bataan Logo"
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>

              {/* Orbit 1 - Horizontal-ish */}
              <div className="absolute w-full h-[80px] border-[1.5px] border-blue-400/30 rounded-[100%] rotate-x-60 animate-orbit-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_#60A5FA]"></div>
              </div>

              {/* Orbit 2 - Tilted Left */}
              <div className="absolute w-full h-[80px] border-[1.5px] border-purple-400/30 rounded-[100%] rotate-[60deg] rotate-x-60 animate-orbit-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_15px_#C084FC]"></div>
              </div>

              {/* Orbit 3 - Tilted Right */}
              <div className="absolute w-full h-[80px] border-[1.5px] border-emerald-400/30 rounded-[100%] rotate-[-60deg] rotate-x-60 animate-orbit-3">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#34D399]"></div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 mb-2 animate-pulse uppercase">
                Verifying Access
              </h2>
              <div className="flex items-center justify-center gap-1.5 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <p className="text-[10px] text-blue-200/80 font-bold uppercase tracking-[0.2em]">Atomic Sync Protocol</p>
              </div>
            </div>
            
            <p className="mt-12 text-[10px] text-white/20 font-medium uppercase tracking-[0.3em] italic">Provincial Government of Bataan</p>
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
            .animate-orbit-1 { animation: orbit-1 3s infinite linear; }
            .animate-orbit-2 { animation: orbit-2 4s infinite linear; }
            .animate-orbit-3 { animation: orbit-3 5s infinite linear; }
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
      <div className="min-h-screen flex items-center justify-center bg-[#050B18] overflow-hidden">
        {/* Futuristic Background Glows */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* ATOMIC SPINNER CONTAINER */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-12">
            
            {/* Nucleus (Bataan Logo) */}
            <div className="relative z-20 w-32 h-32 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.3)] animate-pulse flex items-center justify-center">
              <img 
                src="/images/Ipatroller_Logo.png"
                alt="Bataan Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Orbit 1 - Horizontal-ish */}
            <div className="absolute w-full h-[80px] border-[1.5px] border-blue-400/30 rounded-[100%] rotate-x-60 animate-orbit-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_#60A5FA]"></div>
            </div>

            {/* Orbit 2 - Tilted Left */}
            <div className="absolute w-full h-[80px] border-[1.5px] border-purple-400/30 rounded-[100%] rotate-[60deg] rotate-x-60 animate-orbit-2">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_15px_#C084FC]"></div>
            </div>

            {/* Orbit 3 - Tilted Right */}
            <div className="absolute w-full h-[80px] border-[1.5px] border-emerald-400/30 rounded-[100%] rotate-[-60deg] rotate-x-60 animate-orbit-3">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#34D399]"></div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 mb-2 animate-pulse uppercase">
              Initializing System
            </h2>
            <div className="flex items-center justify-center gap-1.5 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-[10px] text-blue-200/80 font-bold uppercase tracking-[0.2em]">Atomic Sync Protocol</p>
            </div>
          </div>
          
          <p className="mt-12 text-[10px] text-white/20 font-medium uppercase tracking-[0.3em] italic">Provincial Government of Bataan</p>
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
          .animate-orbit-1 { animation: orbit-1 3s infinite linear; }
          .animate-orbit-2 { animation: orbit-2 4s infinite linear; }
          .animate-orbit-3 { animation: orbit-3 5s infinite linear; }
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
