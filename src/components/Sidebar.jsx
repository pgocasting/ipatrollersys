import React from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight, Settings, X, User, LogOut, Menu } from "lucide-react";
import { useFirebase } from "../hooks/useFirebase";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = React.memo(({ 
  sidebarOpen, 
  setSidebarOpen, 
  navigationItems, 
  currentPage, 
  handleNavigation,
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
  onLogout
}) => {
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
  return (
    <TooltipProvider>
      <aside className={`flex h-screen flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out flex-shrink-0 shadow-lg
        ${isCollapsed && !isMobile ? 'w-16' : 'w-72'}
        ${isMobile ? 'block' : 'hidden md:block'}`}>
        
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-700"></div>
          <div className={`relative flex h-20 items-center text-white ${
            isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-6'
          }`}>
            {isCollapsed && !isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsCollapsed(false)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
                  >
                    <img 
                      src="/images/Ipatroller_Logo.png" 
                      alt="IPatroller Logo" 
                      className="h-8 w-8 rounded-lg object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-lg flex items-center justify-center" style={{display: 'none'}}>
                      IP
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex-shrink-0">
                    <img 
                      src="/images/Ipatroller_Logo.png" 
                      alt="IPatroller Logo" 
                      className="h-8 w-8 rounded-lg object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-lg flex items-center justify-center" style={{display: 'none'}}>
                      IP
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold leading-none tracking-tight whitespace-nowrap">
                      IPatroller
                    </h1>
                    <p className="text-sm text-gray-200 font-medium whitespace-nowrap">System Dashboard</p>
                  </div>
                </div>
              </>
            )}
            
            
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {(!isCollapsed || isMobile) && (
              <div className="px-3 pb-3">
                <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Main Menu
                </h2>
              </div>
            )}
            {navigationItems.map((item) => {
              const isActive = currentPage === item.id;
              const Icon = item.icon;

              const NavButton = (
                <Button
                  key={item.id}
                  variant="ghost"
                  size={isCollapsed && !isMobile ? "icon" : "default"}
                  className={`w-full h-11 font-medium transition-all duration-300 group ${
                    isActive 
                      ? 'bg-gray-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                      : 'hover:bg-gray-700 text-gray-200 hover:text-white hover:translate-x-1 hover:shadow-md'
                  } ${
                    isCollapsed && !isMobile ? 'px-2 justify-center' : 'px-3 justify-start'
                  } rounded-lg`}
                  onClick={() => handleNavigation(item.id)}
                >
                  {isCollapsed && !isMobile ? (
                    <Icon className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-300'
                    }`} />
                  ) : (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md transition-all duration-300 flex-shrink-0 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-600 text-gray-300 group-hover:bg-gray-500 group-hover:text-white'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </div>
                  )}
                  {isActive && (!isCollapsed || isMobile) && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Button>
              );

              return isCollapsed && !isMobile ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {NavButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-700 text-white">
                    <p className="font-medium">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : NavButton;
            })}
          </nav>
        </ScrollArea>

        {/* Footer Section */}
        <div className="border-t border-gray-600 bg-gray-800 px-3 py-3">
          {/* User Profile */}
          {isCollapsed && !isMobile ? (
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-all duration-300">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                          <AvatarFallback className="text-xs font-bold bg-gray-600 text-white">{initials}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 bg-white border-gray-300" align="end" side="right">
                      <DropdownMenuLabel className="font-normal p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                            <AvatarFallback className="text-sm font-bold bg-gray-600 text-white">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold leading-none text-gray-800">{userInfo.name}</p>
                            <p className="text-xs text-gray-500">@{userInfo.username}</p>
                            <Badge variant="secondary" className="w-fit text-xs mt-2 bg-gray-200 text-gray-800">
                              {isAdmin ? 'Administrator' : userAccessLevel}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleNavigation('settings')} className="text-gray-700 hover:bg-gray-100">
                        <Settings className="mr-2 h-4 w-4 text-gray-600" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onLogout} className="text-gray-600 hover:bg-gray-100 focus:text-gray-800">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-black text-white">
                  <p className="font-medium">{userInfo.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-3">
              {/* User Profile Card */}
              <div className="relative overflow-hidden rounded-xl bg-gray-700 p-3 text-white">
                <div className="absolute inset-0 bg-gray-600/20"></div>
                <div className="relative flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/30">
                    <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                    <AvatarFallback className="text-xs font-bold bg-white/20 text-white backdrop-blur-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-bold leading-none truncate">{userInfo.name}</p>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs mt-1 w-fit">
                      {isAdmin ? 'Administrator' : userAccessLevel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings and Logout Section */}
          {!isCollapsed && !isMobile && (
            <div className="mt-3 pt-3 border-t border-gray-600 space-y-1">
              {/* Settings Button */}
              {(() => {
                const isActive = currentPage === 'settings';
                return (
                  <Button
                    variant="ghost"
                    size="default"
                    className={`w-full h-9 font-medium transition-all duration-300 group ${
                      isActive 
                        ? 'bg-gray-600 text-white shadow-lg' 
                        : 'hover:bg-gray-700 text-gray-200 hover:text-white'
                    } px-3 justify-start rounded-lg`}
                    onClick={() => handleNavigation('settings')}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </div>
                  </Button>
                );
              })()}
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="default"
                className="w-full h-9 font-medium transition-all duration-300 group hover:bg-red-900/20 text-gray-200 hover:text-red-400 px-3 justify-start rounded-lg"
                onClick={onLogout}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </div>
              </Button>
            </div>
          )}
          
          {/* Collapse Button at Bottom */}
          {!isMobile && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isCollapsed ? "icon" : "default"}
                    className={`w-full h-9 font-medium transition-all duration-300 group hover:bg-gray-700 text-gray-200 hover:text-white ${
                      isCollapsed ? 'px-2 justify-center' : 'px-3 justify-start'
                    } rounded-lg`}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    {isCollapsed ? (
                      <Menu className="h-4 w-4" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <Menu className="h-4 w-4" />
                        <span className="text-sm font-medium">Collapse</span>
                      </div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-black text-white">
                  <p>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
