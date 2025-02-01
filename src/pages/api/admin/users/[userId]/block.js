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

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { blocked: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 