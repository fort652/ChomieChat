import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { parse } from 'cookie';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userData = verifyToken(token);
    const { userId } = req.query;

    // Only allow users to fetch their own data
    if (userData.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } } // Exclude password from response
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format user data
    const formattedUser = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      isBanned: user.isBanned || false,
      isAdmin: user.isAdmin || false,
      // Add any other user fields you need
    };

    return res.json({ user: formattedUser });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 