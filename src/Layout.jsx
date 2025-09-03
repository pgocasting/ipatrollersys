import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";

import { useFirebase } from "./hooks/useFirebase";
import { 
  Home, 
  Car, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Activity
} from "lucide-react";

const SIDEBAR_WIDTH = 224; // 56 * 4 (w-56)

export default function Layout({ children, onNavigate, currentPage, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useFirebase();
  
  // Close sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger');
        if (sidebar && !sidebar.contains(event.target) && !hamburger?.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Close sidebar when navigating to a new page on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [currentPage, sidebarOpen]);
  
  // Use Firebase user data or fallback to default
  const userInfo = user ? {
    name: user.displayName || "Administrator",
    email: user.email || "admin@ipatroller.gov.ph",
    avatar: user.photoURL || null
  } : {
    name: "Administrator",
    email: "admin@ipatroller.gov.ph",
    avatar: null
  };
  
  const initials = userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const [showProfile, setShowProfile] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'ipatroller', label: 'I-Patroller', icon: <Car className="h-5 w-5" /> },
    { id: 'actioncenter', label: 'Action Center', icon: <Activity className="h-5 w-5" /> },
    { id: 'incidents', label: 'Incidents Reports', icon: <AlertTriangle className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  const handleNavigation = (pageId) => {
    // Close mobile sidebar
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
    // Navigate to page
    onNavigate(pageId);
    
    // Update browser history without adding to back stack
    window.history.replaceState({ page: pageId }, '', `/${pageId}`);
  };

  return (
    <div className="min-h-screen transition-all duration-300 max-w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Responsive Sidebar */}
      <aside 
        id="sidebar"
        className={`fixed z-50 top-0 left-0 h-full w-64 md:w-56 backdrop-blur-xl border-r p-1 flex flex-col transition-all duration-300 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } bg-white/95 border-gray-200`}
      >        
        {/* Sidebar Header */}
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center justify-center transition-colors duration-300">
            <img 
              src="/images/Ipatroller_Logo.png" 
              alt="IPatroller Logo" 
              className="h-32 w-auto"
            />
          </div>
          
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-1 h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => { 
                handleNavigation(item.id); 
              }}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={`justify-start h-12 text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                currentPage === item.id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Settings at Bottom */}
        <div className="mt-auto pt-4 border-t transition-colors duration-300 border-gray-200">
          <Button
            onClick={() => { 
              handleNavigation('settings'); 
            }}
            variant={currentPage === 'settings' ? "default" : "ghost"}
            className={`w-full justify-start h-12 text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
              currentPage === 'settings' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <span className="mr-3"><Settings className="h-5 w-5" /></span>
            <span className="truncate">Settings</span>
          </Button>
        </div>
      </aside>

      {/* Responsive Header */}
      <header className="fixed z-30 top-0 left-0 w-full md:left-56 md:w-[calc(100%-224px)] px-3 md:px-6 py-3 md:py-6 backdrop-blur-xl border-b flex items-center justify-between gap-3 md:gap-4 transition-all duration-300 bg-white/80 border-gray-200">
        {/* Hamburger for mobile */}
        <Button
          id="hamburger"
          variant="ghost"
          size="sm"
          className="md:hidden p-2 h-10 w-10 rounded-lg transition-all duration-200"
          onClick={() => setSidebarOpen(v => !v)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <div className="flex items-center gap-3 flex-1">
          <img 
            src="/images/Ipatroller_Logo.png" 
            alt="IPatroller Logo" 
            className="h-44 w-auto md:hidden"
          />
          <h1 className="text-lg md:text-2xl font-bold capitalize truncate transition-colors duration-300 text-gray-900">
            {navigationItems.find(item => item.id === currentPage)?.label || currentPage}
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* User Profile */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 md:gap-3 p-2 h-auto rounded-full transition-all duration-200"
              onClick={() => setShowProfile(v => !v)}
            >
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {initials}
                </span>
              )}
              <span className="hidden sm:block font-medium truncate max-w-[120px] transition-colors duration-300">
                {userInfo.name}
              </span>
            </Button>
            
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl border z-50 p-4 transition-all duration-300 bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold">
                    {initials}
                  </span>
                  <div>
                    <div className="font-semibold transition-colors duration-300 text-gray-900">{userInfo.name}</div>
                    <div className="text-sm transition-colors duration-300 text-gray-600">{userInfo.email}</div>
                  </div>
                </div>
                <Separator className="my-3" />
                <Button 
                  onClick={onLogout} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-screen max-w-full transition-all duration-300 bg-white" 
        style={{ 
          marginLeft: window.innerWidth >= 768 ? SIDEBAR_WIDTH : 0, 
          paddingTop: 72 
        }}>
        <div className="flex-1 min-h-0 max-w-full overflow-auto p-3 md:p-6 mobile-content">
          {children}
        </div>
      </main>
    </div>
  );
} 