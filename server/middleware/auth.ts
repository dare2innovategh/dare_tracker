import { Request, Response, NextFunction } from 'express';

export function auth(req: Request, res: Response, next: NextFunction) {
  console.log('=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('User ID from session:', req.session?.userId);
  console.log('Session exists:', !!req.session);
  console.log('Session data:', req.session);
  
  // Check if user is authenticated via session (like your main app)
  if (req.session && req.session.userId) {
    console.log('✅ User authenticated via session');
    console.log('- User ID:', req.session.userId);
    
    // Set user object for compatibility (like your main app does)
    req.user = {
      id: req.session.userId,
      username: req.session.username || 'authenticated-user',
      role: req.session.role || 'user',
      full_name: req.session.fullName || 'Authenticated User'
    };
    
    return next();
  }
  
  // Alternative session structures to check
  if (req.session && req.session.user) {
    console.log('✅ User found in session.user');
    req.user = req.session.user;
    return next();
  }
  
  // Check if user data is stored differently in session
  if (req.session && req.session.passport && req.session.passport.user) {
    console.log('✅ User found in session.passport.user');
    req.user = req.session.passport.user;
    return next();
  }
  
  console.log('❌ No authentication found');
  console.log('Session keys:', req.session ? Object.keys(req.session) : 'no session');
  
  return res.status(401).json({
    success: false,
    error: 'You are not authorized to access this resource. Please login first.',
    debug: {
      hasSession: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      path: req.path
    }
  });
}

// If the above doesn't work, try this alternative that mimics your main app's auth
export function authLikeMainApp(req: Request, res: Response, next: NextFunction) {
  // This should match exactly how your /api/user endpoint checks authentication
  // Based on your logs, it seems like /api/user works but reports don't
  
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      full_name: req.session.fullName
    };
    return next();
  }
  
  return res.status(401).json({
    success: false,
    error: 'Authentication required'
  });
}