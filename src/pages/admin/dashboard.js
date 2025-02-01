import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Header from '@/components/Header';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingMessages, setClearingMessages] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const authResponse = await axios.get('/api/auth/is-authenticated');
        if (!authResponse.data.user) {
          throw new Error('Not authenticated');
        }
        
        // Check if user is admin
        await axios.get('/api/auth/is-admin');
        
        setUser(authResponse.data.user);
        await fetchData();
      } catch (error) {
        console.error('Admin check error:', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      checkAdmin();
    }
  }, [router.isReady]);

  useEffect(() => {
    const socketInit = async () => {
      await fetch('/api/socketio');
      const socket = io({
        path: '/api/socketio'
      });
      setSocket(socket);
    };

    socketInit();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersResponse = await axios.get('/api/user/user-list');
      setUsers(usersResponse.data.users);
      
      // Set basic stats
      setStats({
        totalUsers: usersResponse.data.pagination.total,
        totalMessages: 0, // TODO: Implement message count
        activeUsers: usersResponse.data.users.length,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const response = await axios.post(`/api/admin/users/${userId}/ban`);
      // Send system message about user being banned
      if (socket) {
        socket.emit('send-message', {
          userId: 'system',
          username: 'System',
          content: `🚫 A user has been ${response.data.isBanned ? 'banned' : 'unbanned'} by an administrator.`
        });
        
        // If the user was banned (not unbanned), emit the ban event
        if (response.data.isBanned) {
          socket.emit('user-banned', { userId });
        }
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleClearMessages = async () => {
    try {
      setClearingMessages(true);
      
      // First emit a message to all clients about clearing
      if (socket) {
        socket.emit('send-message', {
          userId: 'system',
          username: 'System',
          content: '⚠️ Chat messages will be cleared in 3 seconds...'
        });
      }

      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clear messages
      await axios.delete('/api/admin/clear-messages');
      setClearDialogOpen(false);
      
      // Refresh stats after clearing
      await fetchData();
    } catch (error) {
      console.error('Failed to clear messages:', error);
      // Send error message if something went wrong
      if (socket) {
        socket.emit('send-message', {
          userId: 'system',
          username: 'System',
          content: '❌ Failed to clear messages. Please try again.'
        });
      }
    } finally {
      setClearingMessages(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Header user={user} />
      <Container sx={{ mt: 4, height: 'calc(100vh - 100px)', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Admin Dashboard
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setClearDialogOpen(true)}
          >
            Clear All Chats
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h3">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Messages</Typography>
                <Typography variant="h3">{stats.totalMessages}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Users</Typography>
                <Typography variant="h3">{stats.activeUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Management */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <List>
            {users.map((user) => (
              <ListItem
                key={user.userId}
                secondaryAction={
                  <Box>
                    <IconButton 
                      edge="end" 
                      aria-label="ban"
                      onClick={() => handleBanUser(user.userId)}
                      sx={{ 
                        mr: 1,
                        color: user.isBanned ? 'success.main' : 'error.main'
                      }}
                      title={user.isBanned ? 'Unban User' : 'Ban User'}
                    >
                      <BlockIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDeleteUser(user.userId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.username}
                      {user.isBanned && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: 'error.main',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.7rem'
                          }}
                        >
                          BANNED
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Add this Dialog component */}
        <Dialog
          open={clearDialogOpen}
          onClose={() => setClearDialogOpen(false)}
        >
          <DialogTitle>Clear All Messages</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete all chat messages? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setClearDialogOpen(false)} 
              disabled={clearingMessages}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearMessages}
              color="error"
              disabled={clearingMessages}
              startIcon={clearingMessages ? <CircularProgress size={20} /> : <DeleteSweepIcon />}
            >
              {clearingMessages ? 'Clearing...' : 'Clear All Messages'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
} 