import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, VisuallyHidden } from "./components/ui/sheet";
import { Card, CardContent } from "./components/ui/card";

import { useFirebase } from "./hooks/useFirebase";
import { useAuth } from "./contexts/AuthContext";
import { useSidebar } from "./hooks/useSidebar";
import Sidebar from "./components/Sidebar";
import SidebarToggle from "./components/SidebarToggle";
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
  Mountain
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
  const { isAdmin, userAccessLevel, userFirstName, userLastName, userUsername } = useAuth();
  
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
    { id: 'actioncenter', label: 'Action Center', icon: Activity, showFor: 'action-center' },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, showFor: ['admin', 'incidents'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, showFor: 'admin' },
    { id: 'users', label: 'Users', icon: User, showFor: 'admin' },
  ], []);

  // Filter navigation items based on user role and access level - memoized to prevent recalculation
  const navigationItems = React.useMemo(() => 
    allNavigationItems.filter(item => {
      // Admin users can see everything
      if (isAdmin) return true;
      
      // Show for all users
      if (item.showFor === 'all') return true;
      
      // Show based on user access level - handle both string and array
      if (Array.isArray(item.showFor)) {
        return item.showFor.includes(userAccessLevel);
      } else {
        return item.showFor === userAccessLevel;
      }
    }), [allNavigationItems, isAdmin, userAccessLevel]
  );

  const handlePageNavigation = (pageId) => {
    // Use enhanced navigation handler
    enhancedNavigate(pageId);
    
    // Update browser history without adding to back stack
    window.history.replaceState({ page: pageId }, '', `/${pageId}`);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white">
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
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
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
      <main className="flex-1 overflow-auto bg-white">
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
