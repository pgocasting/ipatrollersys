import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Force light theme only
  const theme = 'light';
  const isDark = false;

  useEffect(() => {
    // Always set light theme
    localStorage.setItem('theme', 'light');
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const value = {
    theme,
    isDark,
    // Keep functions for compatibility but they do nothing
    toggleTheme: () => {},
    setLight: () => {},
    setDark: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
