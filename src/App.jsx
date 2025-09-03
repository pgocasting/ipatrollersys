import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import IPatroller from "./IPatroller";
import Reports from "./Reports";
import IncidentsReports from "./IncidentsReports";
import ActionCenter from "./ActionCenter";
import Settings from "./Settings";
import FirebaseTest from "./FirebaseTest";
import FirebaseConnectionTest from "./FirebaseConnectionTest";
import CloudinaryDemo from "./CloudinaryDemo";
import FirebaseCloudinaryDemo from "./FirebaseCloudinaryDemo";
import PhotoMigrationTool from "./components/PhotoMigrationTool";
import UserManager from "./components/UserManager";
import AuthDiagnostic from "./components/AuthDiagnostic";

import { PatrolDataProvider } from "./PatrolDataContext";
import { DataProvider } from "./DataContext";
import { useFirebase } from "./hooks/useFirebase";
import DebugComponent from "./DebugComponent";
import { getCurrentPageFromURL, handleBrowserNavigation, syncURLWithPage } from "./utils/routeUtils";
import { initializeUsers } from "./utils/initUsers";
import "./utils/consoleHelpers"; // Load console helper functions
import "./utils/authTest"; // Load authentication test functions
import "./firebase"; // Initialize Firebase
import "./mobile.css"; // Mobile responsive styles

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Get the current page from URL on initial load using utility function
    return getCurrentPageFromURL();
  });
  const { user, loading, logout } = useFirebase();

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

  const handleLogout = async () => {
    try {
      console.log('🚪 Logout initiated...');
      console.log('👤 Current user before logout:', user?.email);
      
      // First, call Firebase logout to clear authentication
      await logout();
      console.log('✅ Firebase logout completed');
      
      // Add a small delay to ensure Firebase auth state change is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('⏳ Delay completed');
      
      // Clear any stored data or state if needed
      console.log('🧹 Local storage cleared');
      
      // Reset to dashboard page (this will be overridden by the user state change)
      setCurrentPage('dashboard');
      console.log('📄 Page reset to dashboard');
      
      console.log('🎯 Logout completed - waiting for auth state change...');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if Firebase logout fails, still try to redirect
      setCurrentPage('dashboard');
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    // Use utility function to update URL
    window.history.replaceState({}, '', `/${page}`);
  };

  // Listen for browser back/forward buttons and URL changes using utility function
  useEffect(() => {
    const cleanup = handleBrowserNavigation(setCurrentPage);
    return cleanup;
  }, []);

  // Ensure URL is always in sync with current page
  useEffect(() => {
    syncURLWithPage(currentPage);
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'ipatroller':
        return <IPatroller onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'reports':
        return <Reports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'incidents':
        return <IncidentsReports onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'actioncenter':
        return <ActionCenter onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'settings':
        return <Settings onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'firebase-test':
        return <FirebaseTest />;
      case 'firebase-connection-test':
        return <FirebaseConnectionTest />;
      case 'cloudinary-demo':
        return <CloudinaryDemo />;
      case 'firebase-cloudinary-demo':
        return <FirebaseCloudinaryDemo />;
      case 'photo-migration':
        return <PhotoMigrationTool />;
      case 'user-manager':
        return <UserManager />;
      case 'auth-diagnostic':
        return <AuthDiagnostic />;
      default:
        return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} />;
    }
  };

  // Show loading spinner while Firebase is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DebugComponent>
        <PatrolDataProvider>
          <DataProvider>
            <div className="App">
              {user ? renderPage() : <Login onLogin={() => {}} />}
            </div>
          </DataProvider>
        </PatrolDataProvider>
    </DebugComponent>
  );
}
