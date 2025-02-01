import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#2196f3', // A nice blue color
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: mode === 'light' ? '#2c3e50' : '#ffffff',
      secondary: mode === 'light' ? '#666666' : '#a0a0a0',
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#f5f5f5' : '#121212',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          color: mode === 'light' ? '#2c3e50' : '#ffffff',
          boxShadow: mode === 'light' 
            ? '0 2px 4px rgba(0,0,0,0.08)' 
            : '0 2px 4px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          boxShadow: mode === 'light'
            ? '0 2px 12px rgba(0,0,0,0.08)'
            : '0 2px 12px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            color: mode === 'light' ? '#2c3e50' : '#ffffff',
          },
          '& .MuiInputLabel-root': {
            color: mode === 'light' ? '#666666' : '#a0a0a0',
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: mode === 'light' ? '#ffffff' : '#2a2a2a',
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.15)' 
                : 'rgba(255, 255, 255, 0.15)',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#2196f3',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2196f3',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontSize: '1rem',
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(33,150,243,0.2)',
          },
        },
        contained: {
          backgroundColor: '#2196f3',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1976d2',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: '#2c3e50',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light'
            ? '0 2px 12px rgba(0,0,0,0.08)'
            : '0 2px 12px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2196f3',
          color: '#ffffff',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: mode === 'light' ? '#2c3e50' : '#ffffff',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: mode === 'light' ? '#2c3e50' : '#ffffff',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: mode === 'light' ? '#2c3e50' : '#ffffff',
    },
    body1: {
      fontSize: '1rem',
      color: mode === 'light' ? '#2c3e50' : '#ffffff',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
});

export default getTheme;