import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { ThemeToggle } from "./components/ui/theme-toggle";
import { useTheme } from "./ThemeContext";
import { useFirebase } from "./hooks/useFirebase";
import { 
  Home, 
  Car, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Shield,
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
  const { isDarkMode } = useTheme();
  const { user } = useFirebase();
  
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
  const [showNotifications, setShowNotifications] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'ipatroller', label: 'I-Patroller', icon: <Car className="h-5 w-5" /> },
    { id: 'actioncenter', label: 'Action Center', icon: <Activity className="h-5 w-5" /> },
    { id: 'incidents', label: 'Incidents Reports', icon: <AlertTriangle className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 max-w-full ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Fixed Sidebar */}
              <aside className={`fixed z-40 top-0 left-0 h-full w-56 backdrop-blur-xl border-r p-4 flex flex-col transition-all duration-300 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:translate-x-0 ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-700' 
            : 'bg-white/90 border-gray-200'
        }`}>        
                  <div className={`text-xl md:text-2xl font-bold mb-8 tracking-tight flex items-center gap-2 transition-colors duration-300 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
          <Shield className="h-8 w-8" />
          Dashboard
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => { 
                setSidebarOpen(false); 
                onNavigate(item.id); 
              }}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={`justify-start h-12 text-base font-medium transition-all duration-200 ${
                currentPage === item.id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                  : isDarkMode
                    ? 'text-gray-200 hover:text-blue-400 hover:bg-blue-900/20'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Button>
                    ))}
        </nav>

        {/* Settings at Bottom */}
        <div className="mt-auto pt-4 border-t transition-colors duration-300 border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => { 
              setSidebarOpen(false); 
              onNavigate('settings'); 
            }}
            variant={currentPage === 'settings' ? "default" : "ghost"}
            className={`w-full justify-start h-12 text-base font-medium transition-all duration-200 ${
              currentPage === 'settings' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : isDarkMode
                  ? 'text-gray-200 hover:text-blue-400 hover:bg-blue-900/20'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <span className="mr-3"><Settings className="h-5 w-5" /></span>
            Settings
          </Button>
        </div>

              </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Fixed Navbar */}
      <header className={`fixed z-30 top-0 left-0 w-full md:left-56 md:w-[calc(100%-224px)] px-4 md:px-6 py-4 md:py-6 backdrop-blur-xl border-b flex items-center justify-between gap-4 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        {/* Hamburger for mobile */}
        <Button
          variant="ghost"
          size="sm"
          className={`md:hidden p-2 h-10 w-10 rounded-lg transition-all duration-200 ${
            isDarkMode
              ? 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
          onClick={() => setSidebarOpen(v => !v)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className={`text-xl md:text-2xl font-bold capitalize flex-1 truncate transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {navigationItems.find(item => item.id === currentPage)?.label || currentPage}
        </h1>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile */}
        <div className="relative">
          <Button
            variant="ghost"
            className={`flex items-center gap-3 p-2 h-auto rounded-full transition-all duration-200 ${
              isDarkMode
                ? 'hover:bg-blue-900/30'
                : 'hover:bg-blue-100'
            }`}
            onClick={() => setShowProfile(v => !v)}
          >
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {initials}
              </span>
            )}
            <span className={`hidden sm:block font-medium truncate max-w-[120px] transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {userInfo.name}
            </span>
          </Button>
          
          {showProfile && (
            <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-xl border z-50 p-4 transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold">
                  {initials}
                </span>
                <div>
                  <div className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{userInfo.name}</div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{userInfo.email}</div>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-screen max-w-full" style={{ marginLeft: SIDEBAR_WIDTH, paddingTop: 72 }}>
        <div className="flex-1 min-h-0 max-w-full overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 