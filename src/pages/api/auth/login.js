import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { createToken, setTokenCookie } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Find user
    const user = await users.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
    const token = createToken({
      _id: user._id,
      email: user.email,
      username: user.username,
    });

    console.log('Created token:', token);

    // Set cookie
    setTokenCookie(res, token);

    const userData = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    };

    console.log('Login successful for:', email);
    console.log('User data:', userData);

    return res.json({ user: userData });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
