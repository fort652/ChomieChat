import clientPromise from '@/lib/mongodb';
import { verifyToken, createToken, setTokenCookie } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      console.log('No token found in cookies');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userData = verifyToken(token);
    const { username } = req.body;

    console.log('Request body:', req.body);
    console.log('Current user data:', userData);
    console.log('Attempting username update:', { userId: userData.userId, newUsername: username });

    // Validate username
    if (!username) {
      console.log('Username is empty');
      return res.status(400).json({ message: 'Username is required' });
    }
    if (username.length < 3 || username.length > 20) {
      console.log('Username length invalid:', username.length);
      return res.status(400).json({ message: 'Username must be between 3 and 20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      console.log('Username contains invalid characters:', username);
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Check if username is taken by another user
    const existingUser = await users.findOne({
      username,
      _id: { $ne: new ObjectId(userData.userId) }
    });

    if (existingUser) {
      console.log('Username already taken:', username);
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check if it's the same as current username
    const currentUser = await users.findOne({ _id: new ObjectId(userData.userId) });
    if (currentUser.username === username) {
      console.log('Username is same as current:', username);
      return res.status(400).json({ message: 'New username must be different from current username' });
    }

    // Update username
    const result = await users.updateOne(
      { _id: new ObjectId(userData.userId) },
      { $set: { username } }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      console.log('User not found:', userData.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new token with updated username
    const newToken = createToken({
      _id: userData.userId,
      email: userData.email,
      username
    });

    // Set new token in cookie
    setTokenCookie(res, newToken);

    return res.json({ 
      message: 'Username updated successfully',
      user: {
        userId: userData.userId,
        email: userData.email,
        username
      }
    });
  } catch (error) {
    console.error('Update username error:', error);
    return res.status(500).json({ message: 'Failed to update username' });
  }
} 