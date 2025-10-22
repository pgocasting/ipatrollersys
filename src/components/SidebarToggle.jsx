import React from 'react';
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Menu, ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * SidebarToggle Component
 * Handles different toggle button types for sidebar functionality
 */
const SidebarToggle = ({ 
  type = 'collapse', // 'collapse', 'mobile-trigger', 'mobile-close'
  isCollapsed = false,
  sidebarOpen = false,
  onToggle,
  onClose,
  className = '',
  variant = 'ghost',
  size = 'default',
  showTooltip = true,
  disabled = false
}) => {
  const getButtonContent = () => {
    switch (type) {
      case 'mobile-trigger':
        return {
          icon: <Menu className="h-4 w-4" />,
          text: 'Open Menu',
          tooltip: 'Open navigation menu'
        };
      
      case 'mobile-close':
        return {
          icon: <X className="h-5 w-5" />,
          text: 'Close',
          tooltip: 'Close navigation menu'
        };
      
      case 'collapse':
      default:
        return {
          icon: isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />,
          text: isCollapsed ? 'Expand' : 'Collapse',
          tooltip: isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
        };
    }
  };

  const { icon, text, tooltip } = getButtonContent();

  const handleClick = () => {
    if (disabled) return;
    
    if (type === 'mobile-close' && onClose) {
      onClose();
    } else if (onToggle) {
      onToggle();
    }
  };

  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      className={`transition-all duration-300 group ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white'
      }`}
      onClick={handleClick}
      disabled={disabled}
      data-sidebar-trigger={type === 'mobile-trigger' ? 'true' : undefined}
    >
      {size === 'icon' || (type === 'collapse' && isCollapsed) ? (
        icon
      ) : (
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium">{text}</span>
        </div>
      )}
    </Button>
  );

  if (!showTooltip || (type === 'collapse' && !isCollapsed)) {
    return buttonElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonElement}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-700 text-white">
          <p className="font-medium">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SidebarToggle;
