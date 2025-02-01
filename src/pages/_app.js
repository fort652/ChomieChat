import "@/styles/globals.css";
import axios from 'axios';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@/context/ThemeContext';
import { TutorialProvider } from '@/context/TutorialContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import getTheme from '@/theme';
import { useTheme } from '@/context/ThemeContext';

// Configure axios defaults and interceptors
axios.defaults.withCredentials = true;

// Add axios interceptor to handle errors globally
axios.interceptors.response.use(
  response => response,
  error => {
    // For auth pages (login/register), let the page handle its own errors
    if (window.location.pathname.startsWith('/auth-pages/')) {
      return Promise.reject(error);
    }

    // For auth errors, handle redirect silently
    if (error.response?.status === 401) {
      const router = require('next/router').default;
      router.replace('/auth-pages/login');
      return Promise.reject(error);
    }

    // For other pages, handle based on error status
    switch (error.response?.status) {
      case 403:
        window.location.href = '/banned';
        break;
      case 404:
        window.location.href = '/404';
        break;
      default:
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', error);
        }
    }

    // Convert error to user-friendly message
    const userMessage = error.response?.data?.message || 'An error occurred';
    return Promise.reject(new Error(userMessage));
  }
);

function ThemedApp({ Component, pageProps }) {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </MuiThemeProvider>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <TutorialProvider>
        <ThemedApp Component={Component} pageProps={pageProps} />
      </TutorialProvider>
    </ThemeProvider>
  );
}
