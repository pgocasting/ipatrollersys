import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/dark-theme.css'
import App from './App.jsx'

// Force light theme only
const applyInitialTheme = () => {
  try {
    // Always set light theme
    localStorage.setItem('theme', 'light');
    const root = document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');
  } catch (error) {
    console.warn('Could not apply initial theme:', error);
  }
};

// Apply theme immediately
applyInitialTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
