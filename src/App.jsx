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
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <img 
                src="/images/Ipatroller_Logo.png"
                alt="Bataan Logo"
                className="w-32 h-32 object-contain mx-auto relative z-10 drop-shadow-2xl animate-bounce duration-1000"
              />
            </div>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 font-medium tracking-wide">Loading user access level...</p>
            <p className="text-xs text-gray-400 mt-2">Provincial Government of Bataan</p>
          </div>
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <img 
              src="/images/Ipatroller_Logo.png"
              alt="Bataan Logo"
              className="w-32 h-32 object-contain mx-auto relative z-10 drop-shadow-2xl animate-bounce duration-1000"
            />
          </div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium tracking-wide">Initializing...</p>
          <p className="text-xs text-gray-400 mt-2">Provincial Government of Bataan</p>
        </div>
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
