import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  FormHelperText,
  Paper,
  Fade,
} from '@mui/material';
import PasswordInput from '@/components/PasswordInput';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData).catch(error => {
        // Handle 401 error specifically for login
        if (error.response?.status === 401) {
          throw new Error('Invalid email or password');
        }
        throw error;
      });

      console.log('Login successful:', response.data);
      router.replace('/');
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            Welcome Back
          </Typography>

          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            {error && (
              <Fade in={true}>
                <Alert 
                  severity="error" 
                  sx={{ mb: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
              required
            />

            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                height: 46
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => router.push('/auth-pages/register')}
                sx={{ textTransform: 'none' }}
              >
                Don't have an account? Sign up
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}