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
  const { isAdmin, userAccessLevel, userProfileName, userUsername, userAvatar } = useAuth();
  
  // Use Firebase user data or fallback to default
  const userInfo = user ? {
    name: userProfileName || "Administrator",
    username: userUsername || "admin",
    email: user.email || "admin@ipatroller.gov.ph",
    avatar: userAvatar || user.photoURL || null
  } : {
    name: "Administrator",
    username: "admin",
    email: "admin@ipatroller.gov.ph",
    avatar: null
  };
  
  const initials = userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <TooltipProvider>
      <aside className={`flex h-screen flex-col bg-gradient-to-b from-white to-slate-50/30 border-r border-slate-200/60 transition-all duration-300 ease-in-out flex-shrink-0 shadow-[2px_0_20px_rgba(0,0,0,0.04)]
        ${isCollapsed && !isMobile ? 'w-20' : 'w-72'}
        ${isMobile ? 'block' : 'hidden md:block'}`}>
        
        {/* Header Section - Clean Modern Light */}
        <div className="relative border-b border-slate-100">
          <div className={`relative flex h-20 items-center bg-white ${
            isCollapsed && !isMobile ? 'justify-center px-4' : 'justify-between px-5'
          }`}>
            {isCollapsed && !isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onToggleCollapsed && onToggleCollapsed()}
                    className="flex h-11 w-11 items-center justify-center transition-all duration-300 hover:scale-105"
                  >
                    <img 
                      src="/images/Ipatroller_Logo.png" 
                      alt="IPatroller Logo" 
                      className="h-16 w-16 object-contain drop-shadow-sm"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-600 border-blue-600">
                  <p>Expand navigation</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-14 w-14 items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-1.5 shadow-sm">
                  <img 
                    src="/images/Ipatroller_Logo.png" 
                    alt="IPatroller Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[10px] font-extrabold text-slate-400 leading-none tracking-[0.15em] uppercase">
                    1Bataan
                  </h1>
                  <h2 className="text-lg font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent leading-tight tracking-tight uppercase mt-0.5">
                    I-Patroller
                  </h2>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Clean Light Theme */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {(!isCollapsed || isMobile) && (
              <div className="px-3 pb-3">
                <h2 className="text-[9px] font-black tracking-[0.15em] text-slate-400 uppercase">
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
                  className={`relative w-full h-11 font-semibold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30' 
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  } ${
                    isCollapsed && !isMobile ? 'px-2 justify-center' : 'px-3 justify-start'
                  } rounded-lg overflow-hidden`}
                  onClick={() => handleNavigation(item.id)}
                >
                  {isCollapsed && !isMobile ? (
                    <div className={`p-1.5 rounded-md transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 min-w-0 w-full">
                      <div className={`p-1.5 rounded-md transition-all duration-200 flex-shrink-0 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-slate-500 group-hover:text-blue-600'
                      }`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[13px] font-bold tracking-tight">
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  )}
                </Button>
              );

              return isCollapsed && !isMobile ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    {NavButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-blue-600 text-white font-semibold text-xs px-3 py-1.5 border-blue-600">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : NavButton;
            })}
          </nav>
        </ScrollArea>

        {/* Footer Section - Clean Light Profile */}
        <div className="p-3 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="space-y-1 mb-3">
            {/* View Instructions - for command-center users */}
            {userAccessLevel === 'command-center' && !isAdmin && onShowHelp && !isCollapsed && (
              <Button
                variant="ghost"
                className="w-full h-9 font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 px-3 justify-start rounded-lg border border-emerald-200/50 transition-all duration-200 shadow-sm"
                onClick={onShowHelp}
              >
                <HelpCircle className="h-4 w-4 mr-2.5" />
                <span className="text-xs">Help & Guide</span>
              </Button>
            )}

            {!isCollapsed && (
              <>
                <Button
                  variant="ghost"
                  className="w-full h-9 font-semibold hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-3 justify-start rounded-lg transition-all duration-200"
                  onClick={() => handleNavigation('settings')}
                >
                  <Settings className="h-4 w-4 mr-2.5 text-slate-400" />
                  <span className="text-xs">System Settings</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-9 font-semibold hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-3 justify-start rounded-lg transition-all duration-200"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 mr-2.5 text-slate-400" />
                  <span className="text-xs">Sign Out</span>
                </Button>
              </>
            )}
          </div>

          {/* Modern User Profile */}
          {isCollapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-400 transition-all duration-200 p-0 overflow-hidden shadow-sm hover:shadow-md">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                      <AvatarFallback className="text-xs font-black bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-none">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 bg-white rounded-xl border-slate-200 shadow-xl ml-2" align="end" side="right">
                   <div className="flex items-center gap-3 p-3 mb-2 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg">
                      <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                        <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                        <AvatarFallback className="text-sm font-black bg-gradient-to-br from-blue-600 to-blue-500 text-white">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-black text-slate-900 truncate">{userInfo.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">@{userInfo.username}</p>
                      </div>
                    </div>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem onClick={onLogout} className="rounded-md mt-1 text-rose-600 font-semibold hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onToggleCollapsed} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors rounded-md hover:bg-slate-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-600 text-white text-xs font-semibold">
                   <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 px-3 py-3 transition-all duration-200 hover:shadow-md hover:border-blue-300">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-105 ring-2 ring-blue-100">
                  <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                  <AvatarFallback className="text-sm font-black bg-gradient-to-br from-blue-600 to-blue-500 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-slate-900 truncate leading-tight mb-1">{userInfo.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 border border-white animate-pulse"></span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase tracking-wide px-1.5 py-0 h-4">
                      {isAdmin ? 'SYSTEM ADMIN' : userAccessLevel}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onToggleCollapsed}
                className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-100 text-slate-400 hover:text-blue-500"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* System Version & Copyright */}
          {(!isCollapsed || isMobile) && (
            <div className="mt-8 px-2 text-center pb-2">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] leading-none mb-1">
                v2.5.4-STABLE
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                EST. 2025 • UPDATED 2026
              </p>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
