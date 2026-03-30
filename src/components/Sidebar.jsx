import React from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight, Settings, X, User, LogOut, Menu, Shield, HelpCircle } from "lucide-react";
import { useFirebase } from "../hooks/useFirebase";
import { useAuth } from "../contexts/AuthContext";
import SidebarToggle from "./SidebarToggle";

const Sidebar = React.memo(({ 
  sidebarOpen, 
  navigationItems, 
  currentPage, 
  handleNavigation,
  isCollapsed,
  onToggleCollapsed,
  isMobile = false,
  onLogout,
  onCloseSidebar,
  onShowHelp
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
      <aside className={`flex h-screen flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        ${isCollapsed && !isMobile ? 'w-20' : 'w-72'}
        ${isMobile ? 'block' : 'hidden md:block'}`}>
        
        {/* Header Section - Modern White Theme */}
        <div className="relative border-b border-slate-100">
          <div className={`relative flex h-24 items-center ${
            isCollapsed && !isMobile ? 'justify-center px-4' : 'justify-between px-6'
          }`}>
            {isCollapsed && !isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onToggleCollapsed && onToggleCollapsed()}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm hover:bg-blue-100 transition-all duration-300"
                  >
                    <img 
                      src="/images/Ipatroller_Logo.png" 
                      alt="IPatroller Logo" 
                      className="h-8 w-8 object-contain"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900">
                  <p>Expand navigation</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm flex-shrink-0">
                  <img 
                    src="/images/Ipatroller_Logo.png" 
                    alt="IPatroller Logo" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                    IPatroller
                  </h1>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100/50 w-fit">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider whitespace-nowrap">Access Level: {isAdmin ? 'Admin' : userAccessLevel}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Enhanced White Theme */}
        <ScrollArea className="flex-1 py-6">
          <nav className="px-4 space-y-1.5">
            {(!isCollapsed || isMobile) && (
              <div className="px-3 pb-4">
                <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Main Hub
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
                  className={`relative w-full h-12 font-semibold transition-all duration-300 group ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  } ${
                    isCollapsed && !isMobile ? 'px-2 justify-center' : 'px-4 justify-start'
                  } rounded-xl overflow-hidden`}
                  onClick={() => handleNavigation(item.id)}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                  )}

                  {isCollapsed && !isMobile ? (
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-blue-100/50 text-blue-600' : 'text-slate-500 group-hover:text-slate-900'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                        isActive 
                          ? 'bg-white text-blue-600 shadow-sm border border-blue-100' 
                          : 'bg-slate-100/50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-900'
                      }`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">
                        {item.label}
                      </span>
                    </div>
                  )}
                  
                  {!isCollapsed && isActive && (
                    <div className="ml-auto flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </div>
                  )}
                </Button>
              );

              return isCollapsed && !isMobile ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {NavButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white font-bold text-xs px-3 py-2 border-none">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : NavButton;
            })}
          </nav>
        </ScrollArea>

        {/* Footer Section - Integrated Profile */}
        <div className="p-4 border-t border-slate-100">
          <div className="space-y-1.5 mb-4">
            {/* View Instructions - for command-center users */}
            {userAccessLevel === 'command-center' && !isAdmin && onShowHelp && !isCollapsed && (
              <Button
                variant="ghost"
                className="w-full h-10 font-bold bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 px-4 justify-start rounded-xl border border-emerald-100/50 transition-all duration-300"
                onClick={onShowHelp}
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                <span className="text-xs">Help & Guide</span>
              </Button>
            )}

            {!isCollapsed && (
              <>
                <Button
                  variant="ghost"
                  className="w-full h-10 font-bold hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-4 justify-start rounded-xl transition-all duration-300"
                  onClick={() => handleNavigation('settings')}
                >
                  <Settings className="h-4 w-4 mr-3 text-slate-400 group-hover:text-slate-600" />
                  <span className="text-xs">System Settings</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-10 font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-4 justify-start rounded-xl transition-all duration-300"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 mr-3 text-slate-400 group-hover:text-rose-500" />
                  <span className="text-xs">Sign Out</span>
                </Button>
              </>
            )}
          </div>

          {/* New Modern Integration Style User Profile */}
          {isCollapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all duration-300 p-0 overflow-hidden shadow-sm">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                      <AvatarFallback className="text-xs font-black bg-blue-600 text-white rounded-none">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 bg-white rounded-2xl border-slate-200 shadow-2xl ml-2" align="end" side="right">
                   <div className="flex items-center gap-4 p-4 mb-2 bg-slate-50 rounded-xl">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                        <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                        <AvatarFallback className="text-sm font-black bg-blue-600 text-white">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-black text-slate-900 truncate">{userInfo.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">@{userInfo.username}</p>
                      </div>
                    </div>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem onClick={onLogout} className="rounded-lg mt-1 text-rose-600 font-bold hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onToggleCollapsed} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 text-white text-xs font-bold">
                   <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition-all duration-300 hover:shadow-md hover:border-blue-200">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                  <AvatarFallback className="text-sm font-black bg-blue-600 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate leading-tight mb-1">{userInfo.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 border border-white"></span>
                    <Badge variant="secondary" className="bg-blue-100/50 text-blue-700 border-none text-[9px] font-black uppercase tracking-widest px-1.5 py-0 h-4">
                      {isAdmin ? 'SYSTEM ADMIN' : userAccessLevel}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onToggleCollapsed}
                className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white text-slate-400 hover:text-blue-500 shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
