import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Function to get user-specific theme key
  const getUserThemeKey = (userId: string) => `darkMode_user_${userId}`;

  // Function to load theme for a specific user
  const loadUserTheme = (userId: string) => {
    const userThemeKey = getUserThemeKey(userId);
    const savedTheme = localStorage.getItem(userThemeKey);
    
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    
    // Default to light mode for new users
    return false;
  };

  // Function to save theme for current user
  const saveUserTheme = (userId: string, darkMode: boolean) => {
    const userThemeKey = getUserThemeKey(userId);
    localStorage.setItem(userThemeKey, JSON.stringify(darkMode));
  };

  // Check authentication status and user ID on mount and periodically
  useEffect(() => {
    const checkAuthStatus = () => {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      const isAuth = !!(userId && userRole);
      
      setIsAuthenticated(isAuth);
      
      if (isAuth && userId && userId !== currentUserId) {
        // User logged in or switched - load their theme preference
        const userTheme = loadUserTheme(userId);
        setIsDarkMode(userTheme);
        setCurrentUserId(userId);
      } else if (!isAuth && currentUserId) {
        // User logged out - reset to light mode
        setIsDarkMode(false);
        setCurrentUserId(null);
    }
    };

    // Check immediately
    checkAuthStatus();

    // Check periodically for auth changes
    const interval = setInterval(checkAuthStatus, 1000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Apply/remove dark mode class only for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    } else {
      // Always remove dark mode for public pages
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode, isAuthenticated]);

  const toggleDarkMode = () => {
    if (!isAuthenticated || !currentUserId) {
      return; // Don't allow theme changes for unauthenticated users
    }
    
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    saveUserTheme(currentUserId, newDarkMode);
  };

  const resetTheme = () => {
    setIsDarkMode(false);
    document.documentElement.classList.remove('dark-mode');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 