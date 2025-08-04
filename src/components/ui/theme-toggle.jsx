import React from "react";
import { Button } from "./button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className={`p-2 h-10 w-10 rounded-lg transition-all duration-200 ${className} ${
        isDarkMode
          ? 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
} 