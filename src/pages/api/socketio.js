import { Server } from 'socket.io';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['polling', 'websocket'], // Add polling as fallback
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];

        if (!token) {
          return next(new Error('Authentication error'));
        }

        const userData = verifyToken(token);
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

        socket.user = userData;
        next();
      } catch (error) {
        return next(new Error('Authentication error'));
      }
    });

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('send-message', async (message) => {
        try {
          const client = await clientPromise;
          const db = client.db();

          // Check if user is banned before allowing message
          const user = await db.collection('users').findOne({ 
            _id: new ObjectId(socket.user.userId) 
          });

          if (user?.isBanned) {
            socket.emit('error', { message: 'User is banned' });
            return;
          }

          const messageDoc = {
            _id: new ObjectId(),
            userId: message.userId || socket.user.userId,
            username: message.username || socket.user.username,
            content: message.content,
            timestamp: new Date()
          };

          await db.collection('messages').insertOne(messageDoc);
          io.emit('new-message', messageDoc);
        } catch (error) {
          console.error('Message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler; 