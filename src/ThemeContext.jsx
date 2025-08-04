import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {}
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    try {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.warn('Could not detect theme preference, defaulting to light mode');
      return false;
    }
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Apply theme to root element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    console.log('ThemeProvider: Applied theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const value = {
    isDarkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.error('useTheme called outside of ThemeProvider');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 