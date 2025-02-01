import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Headers:', req.headers);
    
    // Get token from cookies
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    console.log('Parsed cookies:', cookies);
    
    const token = cookies.token;
    if (!token) {
      console.log('No token found in cookies');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify the token
    const userData = verifyToken(token);
    console.log('User data from token:', userData);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(25, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    console.log('Pagination params:', { page, limit, skip });

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Get total count
    const total = await users.countDocuments();
    console.log('Total users:', total);

    // Get paginated users with sort by creation date
    const userList = await users.find(
      {}, // query
      {
        projection: {
          // Include only the fields we need
          _id: 1,
          username: 1,
          email: 1,
          createdAt: 1
          // password will be automatically excluded
        }
      }
    )
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .skip(skip)
    .limit(limit)
    .toArray();

    console.log('Found users:', userList.length);

    // Transform the data and add isCurrentUser flag
    const formattedUsers = userList.map(user => {
      const userId = user._id.toString();
      return {
        userId,
        username: user.username || 'Anonymous',
        email: user.email || 'No email',
        createdAt: user.createdAt || new Date(),
        isCurrentUser: userId === userData.userId
      };
    });

    // Add pagination metadata
    const response = {
      users: formattedUsers,
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      currentUserId: userData.userId
    };

    console.log('Sending response with users:', formattedUsers.length);
    return res.json(response);

  } catch (error) {
    console.error('Get user list error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Send more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch user list: ${error.message}`
      : 'Failed to fetch user list';

    return res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 