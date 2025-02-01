import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export function createToken(user) {
  if (!user._id) {
    throw new Error('User must have an _id');
  }

  try {
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Token created:', token);
    return token;
  } catch (error) {
    console.error('Token creation error:', error);
    throw error;
  }
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
}

export function setTokenCookie(res, token) {
  console.log('Setting token cookie:', token);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };

  res.setHeader(
    'Set-Cookie',
    serialize('token', token, cookieOptions)
  );
}

export function removeTokenCookie(res) {
  console.log('Removing token cookie');
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1,
    path: '/',
  };

  res.setHeader(
    'Set-Cookie',
    serialize('token', '', cookieOptions)
  );
}

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
} 