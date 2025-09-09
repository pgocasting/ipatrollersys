import React from 'react';
import { Button } from "./ui/button";
import { X, Settings, ChevronLeft } from "lucide-react";

const Sidebar = React.memo(({ 
  sidebarOpen, 
  setSidebarOpen, 
  navigationItems, 
  currentPage, 
  handleNavigation,
  isCollapsed,
  setIsCollapsed
}) => {
  return (
    <aside 
      id="sidebar"
      className={`fixed z-50 top-0 left-0 h-full backdrop-blur-xl border-r flex flex-col transition-all duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-16 p-2' : 'w-64 md:w-56 p-1'}
        bg-white/95 border-gray-200`}
    >        
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'w-8 h-8' : ''}`}>
          <img 
            src="/images/Ipatroller_Logo.png" 
            alt="IPatroller Logo" 
            className={`transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-32 w-auto'}`}
            loading="eager"
          />
        </div>
        
        <div className="flex items-center gap-1">
          {/* Toggle collapse button (desktop only) */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex p-1 h-8 w-8 hover:bg-gray-100"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>

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
      </div>
      
      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            variant={currentPage === item.id ? "default" : "ghost"}
            className={`${isCollapsed ? 'justify-center' : 'justify-start'} h-12 text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
              currentPage === item.id 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Settings at Bottom */}
      <div className="mt-auto pt-4 border-t transition-colors duration-300 border-gray-200">
          <Button
            onClick={() => handleNavigation('settings')}
            variant={currentPage === 'settings' ? "default" : "ghost"}
            className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} h-12 text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
              currentPage === 'settings' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <span className={isCollapsed ? '' : 'mr-3'}><Settings className="h-5 w-5" /></span>
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
