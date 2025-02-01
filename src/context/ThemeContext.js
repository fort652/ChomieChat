import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Function to get system theme
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Initialize theme after mount
  useEffect(() => {
    setMounted(true);
    // First check localStorage
    const savedMode = window.localStorage.getItem('themeMode');
    
    if (savedMode) {
      setMode(savedMode);
      setIsSystemTheme(false);
    } else {
      // If no saved preference, use system theme
      const systemTheme = getSystemTheme();
      setMode(systemTheme);
      setIsSystemTheme(true);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if using system theme
      if (isSystemTheme) {
        const newMode = e.matches ? 'dark' : 'light';
        setMode(newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isSystemTheme]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setIsSystemTheme(false);
    window.localStorage.setItem('themeMode', newMode);
  };

  // Function to reset to system theme
  const resetToSystemTheme = () => {
    window.localStorage.removeItem('themeMode');
    const systemTheme = getSystemTheme();
    setMode(systemTheme);
    setIsSystemTheme(true);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      toggleTheme, 
      resetToSystemTheme,
      isSystemTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 