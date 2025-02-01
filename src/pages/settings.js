import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import Header from '@/components/Header';
import PasswordInput from '@/components/PasswordInput';
import { useTheme } from '@/context/ThemeContext';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const { mode, toggleTheme, resetToSystemTheme, isSystemTheme } = useTheme();

  useEffect(() => {
    const initializeData = async () => {
      try {
        const authResponse = await axios.get('/api/auth/is-authenticated');
        if (!authResponse.data.user) {
          throw new Error('Not authenticated');
        }
        setUser(authResponse.data.user);
        setFormData(prev => ({
          ...prev,
          username: authResponse.data.user.username
        }));
      } catch (error) {
        router.replace('/auth-pages/login');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      initializeData();
    }
  }, [router.isReady]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccessMessage('');
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting to update username to:', formData.username);
      
      const response = await axios.put('/api/user/update-username', {
        username: formData.username
      });
      
      setSuccessMessage('Username updated successfully');
      
      // Update both local user state and parent state
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      // Refresh the page to update the header
      window.location.reload();
    } catch (error) {
      console.error('Username update error:', error.response?.data || error);
      setErrors(prev => ({
        ...prev,
        username: error.response?.data?.message || 'Failed to update username'
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    try {
      await axios.put('/api/user/update-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccessMessage('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        currentPassword: error.response?.data?.message || 'Failed to update password'
      }));
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <Header user={user} />
      <Container maxWidth="sm" sx={{ height: '100vh' }}>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Username
            </Typography>
            <Box component="form" onSubmit={handleUsernameSubmit}>
              <TextField
                fullWidth
                margin="normal"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Update Username
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <PasswordInput
                fullWidth
                margin="normal"
                name="currentPassword"
                label="Current Password"
                value={formData.currentPassword}
                onChange={handleChange}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
              />
              <PasswordInput
                fullWidth
                margin="normal"
                name="newPassword"
                label="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
              />
              <PasswordInput
                fullWidth
                margin="normal"
                name="confirmPassword"
                label="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Update Password
              </Button>
            </Box>
          </Paper>

          <FormControl component="fieldset">
            <FormLabel component="legend">Theme Preferences</FormLabel>
            <RadioGroup
              value={isSystemTheme ? 'system' : mode}
              onChange={(e) => {
                if (e.target.value === 'system') {
                  resetToSystemTheme();
                } else {
                  if (e.target.value !== mode) {
                    toggleTheme();
                  }
                }
              }}
            >
              <FormControlLabel 
                value="system" 
                control={<Radio />} 
                label="Use system theme" 
              />
              <FormControlLabel 
                value="light" 
                control={<Radio />} 
                label="Light mode" 
              />
              <FormControlLabel 
                value="dark" 
                control={<Radio />} 
                label="Dark mode" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </Container>
    </>
  );
} 