import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/adminAuth';
import { parse } from 'cookie';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (!['DELETE', 'PUT'].includes(req.method)) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userData = verifyToken(token);
    if (!isAdmin(userData)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userId } = req.query;
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    if (req.method === 'DELETE') {
      // Get the socket server instance
      const io = res.socket.server.io;
      
      // Emit a message to the user being deleted
      if (io) {
        io.emit('user-deleted', { userId });
      }

      const result = await users.deleteOne({ _id: new ObjectId(userId) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 