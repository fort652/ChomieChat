import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const tokenData = verifyToken(token);

    // Ensure we have a valid userId
    if (!tokenData.userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    let userId;
    try {
      userId = new ObjectId(tokenData.userId);
    } catch (error) {
      console.error('Invalid ObjectId:', error);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Get user's detailed information
    const userInfo = await users.findOne(
      { _id: userId },
      { 
        projection: { 
          _id: 1,
          email: 1,
          username: 1,
          createdAt: 1
        } 
      }
    );

    if (!userInfo) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate account age and format dates
    const accountAge = Math.floor(
      (new Date() - new Date(userInfo.createdAt)) / (1000 * 60 * 60 * 24)
    );

    return res.json({ 
      user: {
        ...userInfo,
        _id: userInfo._id.toString(), // Convert ObjectId to string
        lastLogin: new Date().toISOString(),
        accountAge,
        createdAt: userInfo.createdAt.toISOString()
      } 
    });
  } catch (error) {
    console.error('User info error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
