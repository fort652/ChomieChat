import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { parse } from 'cookie';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Fetching messages...');
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userData = verifyToken(token);

    // Check if user exists and isn't banned
    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userData.userId) 
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'User is banned' });
    }

    // Get messages with proper sort
    const messages = await db.collection('messages')
      .find({})
      .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first)
      .toArray();

    console.log(`Found ${messages.length} messages in database`);

    // Format messages
    const formattedMessages = messages.map(msg => {
      try {
        // Get the timestamp from the message
        let messageTime = new Date(msg.timestamp);
        
        // Validate the timestamp
        if (isNaN(messageTime.getTime())) {
          messageTime = new Date();
        }

        // Ensure timestamp is not in the future
        if (messageTime > new Date()) {
          messageTime = new Date();
        }

        return {
          id: msg._id.toString(),
          userId: msg.userId || 'unknown',
          username: msg.username || 'Anonymous',
          content: msg.content || '',
          timestamp: messageTime.toISOString()
        };
      } catch (error) {
        console.error('Error formatting message:', msg, error);
        return {
          id: msg._id.toString(),
          userId: 'unknown',
          username: 'Anonymous',
          content: 'Message unavailable',
          timestamp: new Date().toISOString()
        };
      }
    });

    console.log('Returning formatted messages');
    return res.status(200).json({ 
      messages: formattedMessages,
      total: formattedMessages.length
    });

  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
} 