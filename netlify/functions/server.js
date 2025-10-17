const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

const app = express();

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = isProduction ? process.env.CLIENT_ROOT_URI : 'http://localhost:8000';
const SERVER_URL = isProduction ? process.env.SERVER_ROOT_URI : 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:8000'],
  credentials: true
}));
app.use(express.json());

// Allowed domains
const ALLOWED_DOMAINS = ['addaeducation.com', 'adda247.com', 'studyiq.com'];

// JWT Secret (in production, use a secure secret)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  isProduction ? process.env.CLIENT_ROOT_URI : 'http://localhost:8000'
);

// Google OAuth2 scopes
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to validate email domain
const validateEmailDomain = (email) => {
  const domain = email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

// Routes

// Initiate Google OAuth2 login
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  res.json({ authUrl });
});

// Google OAuth2 callback - handle at root level to match redirect URI
app.get('/', async (req, res) => {
  // Check if this is an OAuth callback
  if (req.query.code) {
    try {
      const { code } = req.query;
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      const { email, name, picture } = data;

      // Validate email domain
      if (!validateEmailDomain(email)) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `Email must be from one of these domains: ${ALLOWED_DOMAINS.join(', ')}` 
        });
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          email, 
          name, 
          picture,
          domain: email.split('@')[1]
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token
      const frontendUrl = isProduction ? process.env.CLIENT_ROOT_URI : 'http://localhost:8000';
      res.redirect(`${frontendUrl}/auth/success?token=${token}`);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = isProduction ? process.env.CLIENT_ROOT_URI : 'http://localhost:8000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  } else {
    // Regular health check
    res.json({ 
      status: 'OK', 
      message: 'YouTube Analytics API is running',
      oauth: 'Configured for GradiAI project'
    });
  }
});

// Keep the original callback route for backward compatibility
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    const { email, name, picture } = data;

    // Validate email domain
    if (!validateEmailDomain(email)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `Email must be from one of these domains: ${ALLOWED_DOMAINS.join(', ')}` 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        email, 
        name, 
        picture,
        domain: email.split('@')[1]
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    const frontendUrl = isProduction ? process.env.CLIENT_ROOT_URI : 'http://localhost:8000';
    res.redirect(`${frontendUrl}/auth/success?token=${token}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = isProduction ? process.env.CLIENT_ROOT_URI : 'http://localhost:8000';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

// Verify token endpoint
app.get('/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'YouTube Analytics API is running',
    timestamp: new Date().toISOString()
  });
});

// Export for Netlify Functions
exports.handler = app;
