import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import Header from '@/components/Header';

export default function ErrorPage() {
  const router = useRouter();
  const { code, message } = router.query;

  const errorMessages = {
    '400': 'Bad Request - The request could not be understood',
    '401': 'Unauthorized - Please log in to continue',
    '403': 'Forbidden - You don\'t have permission to access this resource',
    '404': 'Page Not Found - The requested page does not exist',
    '500': 'Internal Server Error - Something went wrong on our end',
  };

  const errorMessage = message || errorMessages[code] || 'An unexpected error occurred';

  return (
    <>
      <Header />
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
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Error {code}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {errorMessage}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
} 