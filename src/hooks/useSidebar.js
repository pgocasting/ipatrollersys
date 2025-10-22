import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing sidebar state and behavior
 * Handles both mobile overlay and desktop collapse functionality
 */
export const useSidebar = () => {
  // Mobile sidebar overlay state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Desktop sidebar collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
      return false;
    }
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [isCollapsed]);

  // Check if current screen is mobile
  const isMobile = useCallback(() => {
    return window.innerWidth < 768;
  }, []);

  // Toggle mobile sidebar overlay
  const toggleSidebarOpen = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Open mobile sidebar
  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  // Close mobile sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Toggle desktop sidebar collapse
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Expand desktop sidebar
  const expandSidebar = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  // Collapse desktop sidebar
  const collapseSidebar = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  // Handle window resize - close mobile sidebar when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen && 
        !event.target.closest('aside') && 
        !event.target.closest('[data-sidebar-trigger]') &&
        !event.target.closest('[data-sheet-content]')
      ) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen && isMobile()) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when mobile sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  // Auto-close mobile sidebar on navigation
  const handleNavigation = useCallback((callback) => {
    return (...args) => {
      // Close mobile sidebar when navigating
      if (sidebarOpen && isMobile()) {
        setSidebarOpen(false);
      }
      // Execute the navigation callback
      if (callback) {
        callback(...args);
      }
    };
  }, [sidebarOpen, isMobile]);

  return {
    // State
    sidebarOpen,
    isCollapsed,
    isMobile: isMobile(),
    
    // Mobile sidebar controls
    toggleSidebarOpen,
    openSidebar,
    closeSidebar,
    
    // Desktop sidebar controls
    toggleCollapsed,
    expandSidebar,
    collapseSidebar,
    
    // Utilities
    handleNavigation,
    
    // State setters (for backward compatibility)
    setSidebarOpen,
    setIsCollapsed
  };
};

export default useSidebar;
