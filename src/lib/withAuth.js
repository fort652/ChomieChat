import { verifyToken } from './auth';
import { parse } from 'cookie';

export function withAuth(handler) {
  return async (req, res) => {
    try {
      console.log('Headers:', req.headers);
      const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
      console.log('Cookies:', cookies);
      
      const token = cookies.token;
      if (!token) {
        console.log('No token found in cookies');
        return res.status(401).json({ message: 'Not authenticated' });
      }

      console.log('Token found:', token);
      const userData = verifyToken(token);
      console.log('Verified user data:', userData);
      
      req.user = userData;
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ 
        message: 'Invalid token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
} 