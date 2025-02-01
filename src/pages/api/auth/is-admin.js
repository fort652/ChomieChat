import { verifyToken } from '@/lib/auth';
import { parse } from 'cookie';
import { isAdmin } from '@/lib/adminAuth';

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
    
    if (!isAdmin(userData)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    return res.json({ isAdmin: true });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(401).json({ message: 'Not authenticated' });
  }
} 