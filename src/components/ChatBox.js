import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Fade,
  Alert,
  Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@/context/ThemeContext';
import io from 'socket.io-client';

export default function ChatBox({ user, messages, onSendMessage, socketConnected, socket }) {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);
  const messagesEndRef = useRef(null);
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good saturation and lightness for readability
    const hue = hash % 360;
    return `hsl(${hue}, 70%, ${isDark ? '35%' : '45%'})`;
  };

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const getInitial = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Add this effect to handle user deletion
  useEffect(() => {
    if (socket) {
      socket.on('user-deleted', (data) => {
        if (data.userId === user?.userId) {
          alert('Your account has been deleted by an administrator.');
          window.location.href = '/auth-pages/login';
        }
      });

      socket.on('user-banned', (data) => {
        if (data.userId === user?.userId) {
          // Immediately redirect to banned page
          window.location.href = '/banned';
        }
      });

      socket.on('error', (error) => {
        if (error.message === 'User no longer exists') {
          alert('Your account has been deleted by an administrator.');
          window.location.href = '/auth-pages/login';
        }
      });

      socket.on('connect_error', (error) => {
        if (error.message === 'User is banned') {
          window.location.href = '/banned';
        }
      });

      socket.on('error', (error) => {
        if (error.message === 'User is banned or no longer exists') {
          window.location.href = '/banned';
        }
      });

      return () => {
        socket.off('user-deleted');
        socket.off('user-banned');
        socket.off('error');
        socket.off('connect_error');
      };
    }
  }, [socket, user]);

  useEffect(() => {
    const socketInit = async () => {
      try {
        await fetch('/api/socketio');
        const socket = io({
          path: '/api/socketio',
          addTrailingSlash: false,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnection: true,
          transports: ['polling', 'websocket'], // Add polling as fallback
          auth: {
            token: document.cookie.split('token=')[1]?.split(';')[0]
          }
        });

        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        setSocket(socket);
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    socketInit();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {!socketConnected && (
        <Alert 
          severity="warning" 
          sx={{ m: 1 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Reconnect
            </Button>
          }
        >
          Connecting to chat server... If this persists, click Reconnect.
        </Alert>
      )}

      {/* Messages Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: 2,
        maxHeight: 'calc(100vh - 200px)',
        backgroundColor: isDark ? 'background.default' : '#f8f9fa',
        '&::-webkit-scrollbar': {
          width: '8px',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: isDark ? '#1e1e1e' : '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: isDark ? '#555' : '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: isDark ? '#666' : '#a1a1a1',
          },
        },
      }}>
        <List sx={{ py: 0 }}>
          {localMessages.map((message, index) => (
            <Fade in={true} key={message.id || index}>
              <ListItem
                sx={{
                  flexDirection: 'column',
                  alignItems: message.userId === user?.userId ? 'flex-end' : 'flex-start',
                  py: 0.5,
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  flexDirection: message.userId === user?.userId ? 'row-reverse' : 'row',
                  gap: 1,
                  mb: 0.5
                }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: message.userId === user?.userId 
                          ? 'primary.main' 
                          : stringToColor(message.userId || message.username),
                        fontSize: '0.875rem',
                      }}
                    >
                      {getInitial(message.username)}
                    </Avatar>
                  </ListItemAvatar>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {message.username || 'Anonymous'}
                  </Typography>
                </Box>
                <Box sx={{ 
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.userId === user?.userId ? 'flex-end' : 'flex-start',
                }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      backgroundColor: message.userId === 'system' 
                        ? 'warning.light'  // Special color for system messages
                        : message.userId === user?.userId 
                          ? 'primary.main'
                          : stringToColor(message.userId || message.username),
                      color: message.userId === 'system' ? 'warning.contrastText' : 'white',
                      borderRadius: message.userId === user?.userId 
                        ? '20px 20px 4px 20px'
                        : '20px 20px 20px 4px',
                      fontStyle: message.userId === 'system' ? 'italic' : 'normal',
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        wordBreak: 'break-word',
                        textShadow: '0px 1px 2px rgba(0,0,0,0.2)',
                        ...(message.userId === 'system' && {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        })
                      }}
                    >
                      {message.content}
                    </Typography>
                  </Paper>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      mt: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Box>
              </ListItem>
            </Fade>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            id="message-input"
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: isDark ? 'background.default' : '#f8f9fa',
              },
            }}
          />
          <IconButton 
            type="submit" 
            color="primary"
            disabled={!newMessage.trim()}
            sx={{
              width: 40,
              height: 40,
              '&:not(:disabled)': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
} 