import React, { useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger } from "./components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { useFirebase } from "./hooks/useFirebase";
import { useAuth } from "./contexts/AuthContext";
import { 
  Home, 
  Car, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Activity,
  Command,
  User,
  LogOut
} from "lucide-react";

export default function Layout({ children, onNavigate, currentPage, onLogout, onShowHelp }) {
  const { user } = useFirebase();
  const { isAdmin, userAccessLevel, userFirstName, userLastName, userUsername } = useAuth();
  
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
  const [mounted, setMounted] = React.useState(false);

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
    if (onNavigate) {
      onNavigate(pageId);
    }
    
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
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar": "hsl(240 5.9% 10%)",
        "--sidebar-foreground": "hsl(240 4.8% 95.9%)",
        "--sidebar-primary": "hsl(224.3 76.3% 48%)",
        "--sidebar-primary-foreground": "hsl(0 0% 100%)",
        "--sidebar-accent": "hsl(240 3.7% 15.9%)",
        "--sidebar-accent-foreground": "hsl(240 4.8% 95.9%)",
        "--sidebar-border": "hsl(240 3.7% 15.9%)",
        "--sidebar-ring": "hsl(217.2 91.2% 59.8%)",
      }}
    >
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              IP
            </div>
            <div className="flex min-w-0 flex-col leading-none">
              <span className="font-semibold truncate">IPatroller</span>
              <span className="text-xs text-muted-foreground truncate">System Dashboard</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        onClick={() => handlePageNavigation(item.id)}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === 'settings'}
                    tooltip="Settings"
                    onClick={() => handlePageNavigation('settings')}
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userInfo.avatar || undefined} alt={userInfo.name} />
              <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{userInfo.name}</div>
              <div className="text-xs text-muted-foreground truncate">@{userInfo.username}</div>
            </div>
          </div>
          <div className="px-2 pb-2">
            <Badge variant="secondary" className="w-fit text-xs">
              {isAdmin ? 'Administrator' : userAccessLevel}
            </Badge>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={onLogout}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="flex h-screen flex-col">
          <div className="flex h-12 items-center gap-2 border-b px-3">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
