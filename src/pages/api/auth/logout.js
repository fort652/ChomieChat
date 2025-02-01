import { removeTokenCookie } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  removeTokenCookie(res);
  return res.json({ message: 'Logged out successfully' });
}
