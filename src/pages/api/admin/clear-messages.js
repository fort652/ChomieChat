import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/adminAuth';
import { parse } from 'cookie';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    const client = await clientPromise;
    const db = client.db();
    
    // Add system message about clearing chat
    await db.collection('messages').insertOne({
      _id: new ObjectId(),
      userId: 'system',
      username: 'System',
      content: '🗑️ An administrator is clearing all messages...',
      timestamp: new Date()
    });

    // Wait a moment for the message to be seen
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Delete all messages
    await db.collection('messages').deleteMany({});

    return res.json({ message: 'All messages cleared successfully' });
  } catch (error) {
    console.error('Clear messages error:', error);
    return res.status(500).json({ message: 'Failed to clear messages' });
  }
} 