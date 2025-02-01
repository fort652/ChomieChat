import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/adminAuth';
import { parse } from 'cookie';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Find user first to check current ban status
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle ban status
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBanned: !user.isBanned } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the socket server instance
    const io = res.socket.server.io;
    
    // If the user is being banned (not unbanned), emit the ban event
    if (!user.isBanned) {
      if (io) {
        io.emit('user-banned', { userId: userId.toString() });
      }
    }

    return res.json({ 
      message: `User ${!user.isBanned ? 'banned' : 'unbanned'} successfully`,
      isBanned: !user.isBanned
    });
  } catch (error) {
    console.error('Ban user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 