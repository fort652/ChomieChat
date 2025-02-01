import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';
import clientPromise from './lib/mongodb';
import { ObjectId } from 'mongodb';

export async function middleware(req) {
  try {
    const token = req.cookies.get('token');
    const { pathname } = req.nextUrl;

    console.log('Middleware processing:', pathname);

    // Static resources that should always be accessible
    const staticPaths = ['/api/socketio', '/_next', '/favicon.ico'];
    if (staticPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Exact paths that banned users can access
    const bannedAllowedPaths = new Set([
      '/banned',
      '/auth-pages/login',
      '/auth-pages/register',
      '/api/auth/logout',
      '/api/auth/is-authenticated',
      '/error'  // Add error page to allowed paths
    ]);

    // Public routes that don't require authentication
    const publicRoutes = new Set([
      '/auth-pages/login',
      '/auth-pages/register',
      '/error'  // Add error page to public routes
    ]);

    // If no token and trying to access public route
    if (!token) {
      if (publicRoutes.has(pathname)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/auth-pages/login', req.url));
    }

    try {
      const userData = verifyToken(token.value);
      const client = await clientPromise;
      const db = client.db();
      
      // Handle database connection errors
      if (!db) {
        console.error('Database connection failed');
        return NextResponse.redirect(new URL('/error?code=500&message=Database%20connection%20failed', req.url));
      }

      const user = await db.collection('users').findOne({ 
        _id: new ObjectId(userData.userId) 
      });

      if (!user) {
        console.log('User not found, clearing token');
        const response = NextResponse.redirect(new URL('/auth-pages/login', req.url));
        response.cookies.delete('token');
        return response;
      }

      // Check if user is banned
      if (user.isBanned) {
        console.log('Banned user attempting to access:', pathname);

        // Check if the path is explicitly allowed for banned users
        const isAllowed = bannedAllowedPaths.has(pathname) || 
          (pathname === `/api/user/${userData.userId}`);

        if (!isAllowed) {
          return NextResponse.redirect(new URL('/banned', req.url));
        }
      } else if (pathname === '/banned') {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Handle authenticated users trying to access public routes
      if (publicRoutes.has(pathname)) {
        if (user.isBanned) {
          return NextResponse.redirect(new URL('/banned', req.url));
        }
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Restricted paths that banned users should never access
      const restrictedPaths = [
        '/users',
        '/settings',
        '/admin',
        '/chat',
        '/api/messages',
        '/api/admin'
      ];

      if (user.isBanned && restrictedPaths.some(path => pathname.startsWith(path))) {
        console.log('Banned user blocked from restricted path:', pathname);
        return NextResponse.redirect(new URL('/banned', req.url));
      }

      return NextResponse.next();

    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      const response = NextResponse.redirect(new URL('/auth-pages/login', req.url));
      response.cookies.delete('token');
      return response;
    }

  } catch (error) {
    console.error('Middleware critical error:', error);
    // For critical errors, redirect to error page with generic message
    return NextResponse.redirect(
      new URL('/error?code=500&message=An%20unexpected%20error%20occurred', req.url)
    );
  }
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};