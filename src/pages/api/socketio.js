import { Server } from 'socket.io';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { parse } from 'cookie';

const ioHandler = (req, res) => {
  // Check if socket server is already initialized
  if (!res.socket.server.io) {
    console.log('*First* Socket.io server initialization');
    
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,  // Add this to prevent potential routing issues
      // Configure transport to prefer WebSocket
      transports: ['websocket', 'polling'],
      // Add ping timeout and interval settings
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Store connected sockets to prevent duplicate connections
    const connectedSockets = new Set();

    // Update middleware to check for banned status
    io.use(async (socket, next) => {
      try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
          return next(new Error('Authentication required'));
        }

        const parsedCookies = parse(cookies);
        const token = parsedCookies.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const userData = verifyToken(token);
        
        // Check if user exists and isn't banned
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ 
          _id: new ObjectId(userData.userId)
        });

        if (!user) {
          return next(new Error('User no longer exists'));
        }

        if (user.isBanned) {
          return next(new Error('User is banned'));
        }

        // Store user data in socket
        socket.userData = userData;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', socket => {
      // Check if this socket is already connected
      if (connectedSockets.has(socket.id)) {
        console.log('Duplicate connection detected:', socket.id);
        socket.disconnect();
        return;
      }

      connectedSockets.add(socket.id);

      socket.on('send-message', async (message) => {
        
        try {
          // Verify user still exists and isn't banned
          const client = await clientPromise;
          const db = client.db();
          const user = await db.collection('users').findOne({ 
            _id: new ObjectId(socket.userData.userId)
          });

          if (!user || user.isBanned) {
            socket.emit('error', { message: 'User is banned or no longer exists' });
            socket.disconnect();
            return;
          }

          const messageId = new ObjectId();
          const now = new Date();

          // Save to database first
          const messageToSave = {
            _id: messageId,
            userId: message.userId,
            username: message.username,
            content: message.content,
            timestamp: now
          };

          // Insert the message
          const result = await db.collection('messages').insertOne(messageToSave);

          if (!result.acknowledged) {
            throw new Error('Failed to save message to database');
          }

          // Only broadcast after successful save
          const broadcastMessage = {
            id: messageId.toString(),
            userId: message.userId,
            username: message.username,
            content: message.content,
            timestamp: now.toISOString()
          };

          io.emit('new-message', broadcastMessage);

        } catch (error) {
          console.error('Message handling error:', error);
          socket.emit('error', { 
            message: 'Failed to process message',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      });

      socket.on('user-banned', (data) => {
        // Broadcast the ban event to all clients
        io.emit('user-banned', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        connectedSockets.delete(socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.io server already initialized');
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler; 