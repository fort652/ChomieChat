import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import io from 'socket.io-client';
import { Container, Box, CircularProgress } from '@mui/material';
import Header from '@/components/Header';
import ChatBox from '@/components/ChatBox';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Single initialization effect
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check authentication
        const authResponse = await axios.get('/api/auth/is-authenticated');
        if (!authResponse.data.user) {
          router.replace('/auth-pages/login');
          return;
        }

        // Set user
        setUser(authResponse.data.user);

        // Only fetch messages if authenticated
        const messagesResponse = await axios.get('/api/messages');
        if (messagesResponse.data?.messages) {
          const sortedMessages = messagesResponse.data.messages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          setMessages(sortedMessages);
        }

        // Initialize socket only if authenticated
        await initializeSocket();
      } catch (error) {
        // Silently redirect to login for any errors
        router.replace('/auth-pages/login');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [router]);

  const initializeSocket = async () => {
    try {
      await fetch('/api/socketio');
      const socketInstance = io({
        path: '/api/socketio'
      });

      socketInstance.on('connect', () => {
        setSocketConnected(true);
      });

      socketInstance.on('new-message', (message) => {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });

      socketInstance.on('disconnect', () => {
        setSocketConnected(false);
      });

      setSocket(socketInstance);

      return socketInstance;
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  };

  const handleSendMessage = useCallback((content) => {
    if (socket && user) {
      socket.emit('send-message', {
        userId: user.userId,
        username: user.username,
        content
      });
    }
  }, [socket, user]);

  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header user={user} />
      <Container sx={{ mt: 4, height: 'calc(100vh - 100px)' }}>
        <ChatBox 
          user={user}
          messages={messages}
          onSendMessage={handleSendMessage}
          socketConnected={socketConnected}
          socket={socket}
        />
      </Container>
    </>
  );
}