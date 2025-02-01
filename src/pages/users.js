import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
} from '@mui/material';
import Header from '@/components/Header';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState(null);

  let isBanned = user?.isBanned;

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
        console.error('Failed to fetch user data:', error);
        if (error.response?.status === 401) {
          router.replace('/auth-pages/login');
        }
      } finally {
         if (isBanned) {
          router.replace('/banned');
        } else {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // First check authentication
        const authResponse = await axios.get('/api/auth/is-authenticated');
        if (!authResponse.data.user) {
          throw new Error('Not authenticated');
        }
        setUser(authResponse.data.user);

        console.log("userfromlogs", user);

        // Fetch user list
        await fetchUsers(1, rowsPerPage);
      } catch (error) {
        console.error('Initialization error:', error);
        router.replace('/auth-pages/login');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && router.pathname !== '/auth-pages/login') {
      initializeData();
    }
  }, [router.isReady, router.pathname]);

  const fetchUsers = async (pageNum, limit) => {
    try {
      setError(null);
      console.log('Fetching users:', { pageNum, limit });
      
      const response = await axios.get('/api/user/user-list', {
        params: {
          page: pageNum,
          limit: limit
        }
      });

      console.log('User list response:', response.data);
      
      if (response.data.users) {
        setUsers(response.data.users);
        setTotalUsers(response.data.pagination.total);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error.response || error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch users'
      );
      setUsers([]);
      setTotalUsers(0);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchUsers(newPage + 1, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchUsers(1, newRowsPerPage);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header user={user} />
      <Container sx={{ mt: 4, height: '100vh' }}>
        <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
          All Users
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }} aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Joined Date</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((userItem) => (
                <TableRow
                  key={userItem.userId}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: userItem.isCurrentUser ? 'action.hover' : 'inherit',
                  }}
                >
                  <TableCell component="th" scope="row">
                    {userItem.username}
                  </TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>{formatDate(userItem.createdAt)}</TableCell>
                  <TableCell align="center">
                    {userItem.isCurrentUser ? (
                      <Chip 
                        label="You" 
                        color="primary" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        label="Active" 
                        color="success" 
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalUsers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Container>
    </>
  );
}