import { withAuth } from '@/lib/withAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return res.json({ user: req.user });
}

export default withAuth(handler);