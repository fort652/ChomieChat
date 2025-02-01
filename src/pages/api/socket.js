import { Server } from 'socket.io';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server');

    const io = new Server(res.socket.server, {
      transports: ['websocket'],
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', socket => {
      console.log('Client connected:', socket.id);

      socket.on('send-message', async (message) => {
        try {
          const timestamp = new Date();
          const messageId = new ObjectId();

          // Broadcast immediately with permanent ID
          const broadcastMessage = {
            id: messageId.toString(),
            userId: message.userId,
            username: message.username,
            content: message.content,
            timestamp: timestamp.toISOString()
          };
          
          // Broadcast to all clients immediately
          io.emit('new-message', broadcastMessage);

          // Save to database
          const messageToSave = {
            _id: messageId,
            userId: message.userId,
            username: message.username,
            content: message.content,
            timestamp
          };

          const client = await clientPromise;
          const db = client.db();
          await db.collection('messages').insertOne(messageToSave);

        } catch (error) {
          console.error('Message handling error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
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