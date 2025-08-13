import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import IPatroller from "./IPatroller";
import Reports from "./Reports";
import IncidentsReports from "./IncidentsReports";
import ActionCenter from "./ActionCenter";
import Settings from "./Settings";
import { ThemeProvider } from "./ThemeContext";
import { PatrolDataProvider } from "./PatrolDataContext";
import { DataProvider } from "./DataContext";
import { useFirebase } from "./hooks/useFirebase";
import DebugComponent from "./DebugComponent";
import "./firebase"; // Initialize Firebase

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Get the current page from URL on initial load
    const path = window.location.pathname.replace('/', '');
    const validPages = ['dashboard', 'ipatroller', 'reports', 'incidents', 'actioncenter', 'settings'];
    return validPages.includes(path) ? path : 'dashboard';
  });
  const { user, loading, logout } = useFirebase();

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
      localStorage.removeItem('theme'); // Keep theme preference
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
    window.history.pushState({}, '', `/${page}`);
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      setCurrentPage(path || 'dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      <ThemeProvider>
        <PatrolDataProvider>
          <DataProvider>
            <div className="App">
              {user ? renderPage() : <Login onLogin={() => {}} />}
            </div>
          </DataProvider>
        </PatrolDataProvider>
      </ThemeProvider>
    </DebugComponent>
  );
}
