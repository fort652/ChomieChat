import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsSystemDaydreamIcon from '@mui/icons-material/SettingsSystemDaydream';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';
import { isAdmin } from '@/lib/adminAuth';
import { useTheme } from '@/context/ThemeContext';
import { useTutorial } from '@/context/TutorialContext';
import TutorialTooltip from './TutorialTooltip';

export default function Header({ user: initialUser }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const { mode, toggleTheme, resetToSystemTheme, isSystemTheme } = useTheme();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const isBanned = user?.isBanned;
  const { showTutorial, currentStep } = useTutorial();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/is-authenticated');
        if (response.data.user) {
          // Get full user data including ban status
          const userResponse = await axios.get(`/api/user/${response.data.user.userId}`);
          setUser(userResponse.data.user);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          router.replace('/auth-pages/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleClose();
    if (!isBanned) {
      router.push('/settings');
    }
  };

  const handleUsers = () => {
    handleClose();
    if (!isBanned) {
      router.push('/users');
    }
  };

  const handleAdminDashboard = () => {
    handleClose();
    if (!isBanned) {
      router.push('/admin/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.replace('/auth-pages/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeClick = () => {
    if (isSystemTheme) {
      toggleTheme();
    } else {
      resetToSystemTheme();
    }
  };

  if (loading) {
    return (
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              ChomiesChat
            </Typography>
          </Box>
          <CircularProgress size={24} color="inherit" />
        </Toolbar>
      </AppBar>
    );
  }
  
  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => !isBanned && router.push('/')}
              sx={{ 
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                ...(isBanned && {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                })
              }}
              title={isBanned ? "Access restricted" : "Home"}
              disabled={isBanned}
            >
              <HomeIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                cursor: isBanned ? 'not-allowed' : 'pointer',
                color: 'text.primary',
                opacity: isBanned ? 0.5 : 1,
              }}
              onClick={() => !isBanned && router.push('/')}
            >
              ChomiesChat
            </Typography>
          </Box>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" color="text.primary">
                {user.username}
                {isBanned && (
                  <Typography
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    BANNED
                  </Typography>
                )}
              </Typography>
              {!isBanned && (
                <IconButton
                  id="user-avatar"
                  size="large"
                  aria-label="account settings"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                  sx={{
                    position: 'relative',
                    '&.highlight': {
                      zIndex: 10000
                    }
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              )}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {!isBanned && (
                  <>
                    {isAdmin(user) && (
                      <MenuItem onClick={handleAdminDashboard}>
                        <DashboardIcon sx={{ mr: 1 }} /> Admin Dashboard
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleUsers}>
                      <PeopleIcon sx={{ mr: 1 }} /> Users
                    </MenuItem>
                    <MenuItem onClick={handleSettings}>
                      <SettingsIcon sx={{ mr: 1 }} /> Settings
                    </MenuItem>
                    <Divider />
                  </>
                )}
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button color="primary" onClick={() => router.push('/auth-pages/login')}>
              Login
            </Button>
          )}
          {!isBanned && (
            <IconButton 
              id="theme-toggle"
              onClick={handleThemeClick} 
              color="inherit"
              title={isSystemTheme ? "Using system theme" : "Click to use system theme"}
            >
              {isSystemTheme ? (
                <SettingsSystemDaydreamIcon />
              ) : mode === 'dark' ? (
                <Brightness7Icon />
              ) : (
                <Brightness4Icon />
              )}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      {showTutorial && <TutorialTooltip step={currentStep} />}
    </>
  );
} 