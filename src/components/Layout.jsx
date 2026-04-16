import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { Card, CardContent } from "./ui/card";

import { useFirebase } from "../hooks/useFirebase";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "./Sidebar";
import SidebarToggle from "./SidebarToggle";
import { 
  Home, 
  Car, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Bell,
  Activity,
  Command,
  User,
  Mountain,
  ScrollText
} from "lucide-react";

const SIDEBAR_WIDTH = 224; // 56 * 4 (w-56)

export default function Layout({ children, onNavigate, currentPage, onLogout, onShowHelp }) {
  const {
    sidebarOpen,
    isCollapsed,
    isMobile,
    openSidebar,
    closeSidebar,
    toggleCollapsed,
    handleNavigation
  } = useSidebar();
  const { user } = useFirebase();
  const { isAdmin, userAccessLevel, userViewingPage, userFirstName, userLastName, userUsername } = useAuth();
  
  // Enhanced navigation handler with auto-close functionality
  const enhancedNavigate = handleNavigation(onNavigate);
  
  // Use Firebase user data or fallback to default
  const userInfo = user ? {
    name: userFirstName && userLastName ? `${userFirstName} ${userLastName}` : (user.displayName || "Administrator"),
    username: userUsername || "admin",
    email: user.email || "admin@ipatroller.gov.ph",
    avatar: user.photoURL || null
  } : {
    name: "Administrator",
    username: "admin",
    email: "admin@ipatroller.gov.ph",
    avatar: null
  };
  
  const initials = userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const [showProfile, setShowProfile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define all navigation items - moved outside component to prevent recreation
  const allNavigationItems = React.useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: Home, showFor: 'admin' },
    { id: 'ipatroller', label: 'I-Patroller', icon: Car, showFor: ['admin', 'ipatroller'] },
    { id: 'commandcenter', label: 'Command Center', icon: Command, showFor: ['command-center', 'ipatroller'] },
    { id: 'actioncenter', label: 'Action Center', icon: Activity, showFor: ['action-center', 'ipatroller'] },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, showFor: ['admin', 'incidents'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, showFor: ['admin', 'ipatroller'] },
    { id: 'users', label: 'Users', icon: User, showFor: 'admin' },
    { id: 'logs', label: 'Logs', icon: ScrollText, showFor: 'admin' },
  ], []);

  // Filter navigation items based on user role and access level - memoized to prevent recalculation
  const navigationItems = React.useMemo(() => 
    allNavigationItems.filter(item => {
      // Admin users can see everything
      if (isAdmin) return true;

      // Viewing users can only see their allowed page
      if (userAccessLevel === 'viewing') {
        return Boolean(userViewingPage) && item.id === userViewingPage;
      }
      
      // Show for all users
      if (item.showFor === 'all') return true;
      
      // Show based on user access level - handle both string and array
      if (Array.isArray(item.showFor)) {
        return item.showFor.includes(userAccessLevel);
      } else {
        return item.showFor === userAccessLevel;
      }
    }), [allNavigationItems, isAdmin, userAccessLevel, userViewingPage]
  );

  const handlePageNavigation = (pageId) => {
    // Use enhanced navigation handler
    enhancedNavigate(pageId);
    
    // Update browser history without adding to back stack
    window.history.replaceState({ page: pageId }, '', `/${pageId}`);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative flex flex-col items-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            {/* White Theme Mini Atomic Core */}
            <div className="relative z-10 w-16 h-16 p-2 bg-white/40 backdrop-blur-md rounded-full border border-white shadow-[0_4px_16px_rgba(37,99,235,0.08)] animate-pulse flex items-center justify-center">
              <img 
                src="/images/Ipatroller_Logo.png"
                alt="Bataan Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {/* High-Contrast Mini Orbits */}
            <div className="absolute w-full h-[30px] border border-blue-500/20 rounded-[100%] rotate-x-60 animate-orbit-fast-1"></div>
            <div className="absolute w-full h-[30px] border border-purple-500/20 rounded-[100%] rotate-[60deg] rotate-x-60 animate-orbit-fast-2"></div>
            <div className="absolute w-full h-[30px] border border-emerald-500/20 rounded-[100%] rotate-[-60deg] rotate-x-60 animate-orbit-fast-3"></div>
          </div>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] animate-pulse">Syncing Resources...</p>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .rotate-x-60 { transform: rotateX(60deg); }
            @keyframes orbit-fast {
              from { transform: rotateX(65deg) rotate(0deg); }
              to { transform: rotateX(65deg) rotate(360deg); }
            }
            .animate-orbit-fast-1 { animation: orbit-fast 1.5s infinite linear; }
            .animate-orbit-fast-2 { animation: orbit-fast 2s infinite linear; }
            .animate-orbit-fast-3 { animation: orbit-fast 2.5s infinite linear; }
          `}} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-950">
      {/* Mobile Sidebar using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={closeSidebar}>
        <SheetTrigger asChild>
          <div style={{ display: 'none' }}></div>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className={`${isCollapsed ? 'w-16' : 'w-72'} p-0 transition-all duration-300`}
          data-sheet-content="true"
        >
          <span className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </span>
          <Sidebar 
            sidebarOpen={true}
            navigationItems={navigationItems}
            currentPage={currentPage}
            handleNavigation={handlePageNavigation}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
            isMobile={true}
            onLogout={onLogout}
            onCloseSidebar={closeSidebar}
            onShowHelp={onShowHelp}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          sidebarOpen={false}
          navigationItems={navigationItems}
          currentPage={currentPage}
          handleNavigation={handlePageNavigation}
          isCollapsed={isCollapsed}
          onToggleCollapsed={toggleCollapsed}
          isMobile={false}
          onLogout={onLogout}
          onShowHelp={onShowHelp}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Menu Button - Fixed Position */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <SidebarToggle
          type="mobile-trigger"
          variant="outline"
          size="icon"
          className="bg-white shadow-md border-gray-200 text-black hover:bg-gray-50"
          onToggle={openSidebar}
          showTooltip={false}
        />
      </div>
    </div>
  );
} 
