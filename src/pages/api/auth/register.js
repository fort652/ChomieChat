import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { createToken, setTokenCookie } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, email, password } = req.body;

    // Log incoming request data (excluding password)
    console.log('Registration attempt:', { username, email });

    // Input validation
    if (!username || !email || !password) {
      console.log('Missing required fields:', { 
        hasUsername: !!username, 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      return res.status(400).json({ 
        message: 'All fields are required',
        field: !username ? 'username' : !email ? 'email' : 'password'
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        message: 'Username must be between 3 and 20 characters',
        field: 'username'
      });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        message: 'Username can only contain letters, numbers, and underscores',
        field: 'username'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address',
        field: 'email'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        field: 'password'
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one uppercase letter',
        field: 'password'
      });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one lowercase letter',
        field: 'password'
      });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one number',
        field: 'password'
      });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Check if username is taken
    const existingUsername = await users.findOne({ username });
    if (existingUsername) {
      console.log('Username already taken:', username);
      return res.status(400).json({ 
        message: 'Username is already taken',
        field: 'username'
      });
    }

    // Check if email is taken
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      console.log('Email already registered:', email);
      return res.status(400).json({ 
        message: 'Email is already registered',
        field: 'email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await users.insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const user = {
      _id: result.insertedId,
      email,
      username,
    };

    // Create and set token
    const token = createToken(user);
    setTokenCookie(res, token);

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Registration error details:', error);
    return res.status(500).json({ 
      message: 'An error occurred during registration. Please try again later.' 
    });
  }
}
