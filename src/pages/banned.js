import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import Header from '@/components/Header';

export default function BannedPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await axios.get('/api/auth/is-authenticated');
        setUser(response.data.user);
      } catch (error) {
        router.replace('/auth-pages/login');
      }
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.replace('/auth-pages/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header user={user} />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}
        >
          <BlockIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Account Suspended
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your account has been suspended by an administrator. If you believe this is a mistake, 
            please contact support.
          </Typography>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Logout
          </Button>
        </Paper>
      </Container>
    </>
  );
} 