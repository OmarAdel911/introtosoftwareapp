const express = require('express');
const router = express.Router();
const { getKeycloak } = require('../config/keycloak');

/**
 * Keycloak Routes
 * 
 * These routes handle Keycloak authentication flows
 */

// Login route - redirects to Keycloak
router.get('/login', (req, res) => {
  const keycloak = getKeycloak();
  if (!keycloak) {
    return res.status(503).json({ 
      error: 'Keycloak not configured',
      message: 'Please configure Keycloak environment variables'
    });
  }
  
  // Build redirect URI properly - use the callback route
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5001';
  const redirectUri = `${protocol}://${host}/api/keycloak/callback`;
  
  // Get Keycloak config
  const { keycloakConfig } = require('../config/keycloak');
  const authUrl = `${keycloakConfig.serverUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;
  
  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in session for validation
  if (req.session) {
    req.session.keycloakState = state;
  }
  
  // Build query parameters
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state: state
  });
  
  const loginUrl = `${authUrl}?${params.toString()}`;
  res.redirect(loginUrl);
});

// Logout route
router.get('/logout', (req, res) => {
  const keycloak = getKeycloak();
  if (!keycloak) {
    return res.status(503).json({ error: 'Keycloak not configured' });
  }
  
  const logoutUrl = keycloak.logoutUrl(req, res);
  res.redirect(logoutUrl);
});

// Temporary token storage for one-time token exchange
const tempTokens = new Map();

// Callback route (handled by Keycloak middleware)
router.get('/callback', async (req, res, next) => {
  const keycloak = getKeycloak();
  
  if (!keycloak) {
    return res.status(503).json({ error: 'Keycloak not configured' });
  }
  
  // Keycloak middleware should process the callback automatically
  // Check if we have an authorization code
  const code = req.query.code;
  const error = req.query.error;
  
  if (error) {
    // Authentication error from Keycloak
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error&error=${encodeURIComponent(error)}`);
  }
  
  if (!code) {
    // No code, redirect to login
    return res.redirect('/api/keycloak/login');
  }
  
  // Use Keycloak middleware to process the callback and exchange code for tokens
  // The middleware will set req.kauth if successful
  return keycloak.protect()(req, res, async (err) => {
    if (err) {
      console.error('Keycloak callback error:', err);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error`);
    }
    
    // Check if authentication was successful
    if (req.kauth && req.kauth.grant) {
      try {
        // Sync user and generate JWT token
        const { PrismaClient } = require('@prisma/client');
        const jwt = require('jsonwebtoken');
        const prisma = new PrismaClient();

        const token = req.kauth.grant.access_token.content;
        const userEmail = token.email;
        const userName = token.name || token.preferred_username || userEmail.split('@')[0];
        const keycloakRoles = token.realm_access?.roles || [];

        // Map Keycloak roles to database roles
        let role = 'FREELANCER'; // default
        if (keycloakRoles.includes('admin') || keycloakRoles.includes('ADMIN')) {
          role = 'ADMIN';
        } else if (keycloakRoles.includes('client') || keycloakRoles.includes('CLIENT')) {
          role = 'CLIENT';
        } else if (keycloakRoles.includes('freelancer') || keycloakRoles.includes('FREELANCER')) {
          role = 'FREELANCER';
        }

        // Find or create user in database
        let user = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!user) {
          // Create new user from Keycloak
          user = await prisma.user.create({
            data: {
              email: userEmail,
              name: userName,
              password: '', // No password for Keycloak users
              role: role,
              image: null,
            },
          });
        } else {
          // Update existing user if needed
          if (user.name !== userName || user.role !== role) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: userName,
                role: role,
              },
            });
          }
        }

        // Generate JWT token for the user
        const jwtToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Create a temporary one-time token
        const tempToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Store token data temporarily (expires in 5 minutes)
        tempTokens.set(tempToken, {
          jwtToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            bio: user.bio,
            skills: user.skills,
            hourlyRate: user.hourlyRate,
            title: user.title,
            location: user.location,
            website: user.website,
            linkedin: user.linkedin,
            github: user.github,
          },
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        // Clean up expired tokens
        setTimeout(() => {
          tempTokens.delete(tempToken);
        }, 5 * 60 * 1000);

        // Redirect to frontend with temporary token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/keycloak-callback?token=${tempToken}`);
      } catch (syncError) {
        console.error('Error syncing user:', syncError);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error`);
      }
    } else {
      // Authentication failed
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error`);
    }
  });
});

// Direct login endpoint (bypasses Keycloak UI)
router.post('/direct-login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { keycloakConfig } = require('../config/keycloak');
    const axios = require('axios');

    // Use Keycloak's token endpoint with password grant (Resource Owner Password Credentials)
    const tokenUrl = `${keycloakConfig.serverUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
    
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: keycloakConfig.clientId,
      username: email,
      password: password,
      scope: 'openid profile email'
    });

    try {
      // Get access token from Keycloak
      const tokenResponse = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Decode token to get user info
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(access_token);
      
      if (!decoded || !decoded.email) {
        return res.status(401).json({ error: 'Invalid token received from Keycloak' });
      }

      // Sync user with database
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const userEmail = decoded.email;
      const userName = decoded.name || decoded.preferred_username || userEmail.split('@')[0];
      const keycloakRoles = decoded.realm_access?.roles || [];

      // Map Keycloak roles to database roles
      let role = 'FREELANCER';
      if (keycloakRoles.includes('admin') || keycloakRoles.includes('ADMIN')) {
        role = 'ADMIN';
      } else if (keycloakRoles.includes('client') || keycloakRoles.includes('CLIENT')) {
        role = 'CLIENT';
      } else if (keycloakRoles.includes('freelancer') || keycloakRoles.includes('FREELANCER')) {
        role = 'FREELANCER';
      }

      // Find or create user in database
      let user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: userName,
            password: '', // No password for Keycloak users
            role: role,
            image: null,
          },
        });
      } else {
        // Update existing user if needed
        if (user.name !== userName || user.role !== role) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: userName,
              role: role,
            },
          });
        }
      }

      // Generate JWT token for the user
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '24h' } // Longer expiry if remember me
      );

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: {
          id: userWithoutPassword.id,
          email: userWithoutPassword.email,
          name: userWithoutPassword.name,
          role: userWithoutPassword.role,
          image: userWithoutPassword.image,
          bio: userWithoutPassword.bio,
          skills: userWithoutPassword.skills,
          hourlyRate: userWithoutPassword.hourlyRate,
          title: userWithoutPassword.title,
          location: userWithoutPassword.location,
          website: userWithoutPassword.website,
          linkedin: userWithoutPassword.linkedin,
          github: userWithoutPassword.github,
        },
        token: jwtToken,
        refreshToken: refresh_token // Optionally return refresh token
      });
    } catch (keycloakError) {
      console.error('Keycloak authentication error:', keycloakError.response?.data || keycloakError.message);
      
      if (keycloakError.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      return res.status(500).json({ error: 'Authentication failed. Please try again.' });
    }
  } catch (error) {
    console.error('Direct login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Exchange temporary token for JWT token
router.get('/exchange-token', (req, res) => {
  const tempToken = req.query.token;
  
  if (!tempToken) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  const tokenData = tempTokens.get(tempToken);
  
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Check if token expired
  if (Date.now() > tokenData.expiresAt) {
    tempTokens.delete(tempToken);
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Delete token (one-time use)
  tempTokens.delete(tempToken);
  
  // Return JWT token and user data
  res.json({
    success: true,
    token: tokenData.jwtToken,
    user: tokenData.user
  });
});

// Get current user info from Keycloak
router.get('/me', (req, res) => {
  const keycloak = getKeycloak();
  
  if (!keycloak || !req.kauth || !req.kauth.grant) {
    return res.status(401).json({ error: 'Not authenticated via Keycloak' });
  }

  const token = req.kauth.grant.access_token.content;
  
  res.json({
    success: true,
    data: {
      id: token.sub,
      email: token.email,
      name: token.name || token.preferred_username,
      roles: token.realm_access?.roles || [],
      emailVerified: token.email_verified,
    }
  });
});

// Sync Keycloak user with database and return JWT token
router.post('/sync', async (req, res) => {
  try {
    const keycloak = getKeycloak();
    
    if (!keycloak || !req.kauth || !req.kauth.grant) {
      return res.status(401).json({ error: 'Not authenticated via Keycloak' });
    }

    const { PrismaClient } = require('@prisma/client');
    const jwt = require('jsonwebtoken');
    const prisma = new PrismaClient();

    const token = req.kauth.grant.access_token.content;
    const { email, name, roles, role: preferredRole } = req.body;

    // Use email from token if not provided
    const userEmail = email || token.email;
    const userName = name || token.name || token.preferred_username || userEmail.split('@')[0];
    const keycloakRoles = roles || token.realm_access?.roles || [];

    // Map Keycloak roles to database roles
    // If preferredRole is provided (from registration), use it; otherwise check Keycloak roles
    let role = preferredRole || 'FREELANCER'; // default
    if (!preferredRole) {
      // Only check Keycloak roles if no preferred role was provided
      if (keycloakRoles.includes('admin') || keycloakRoles.includes('ADMIN')) {
        role = 'ADMIN';
      } else if (keycloakRoles.includes('client') || keycloakRoles.includes('CLIENT')) {
        role = 'CLIENT';
      } else if (keycloakRoles.includes('freelancer') || keycloakRoles.includes('FREELANCER')) {
        role = 'FREELANCER';
      }
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      // Create new user from Keycloak
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          password: '', // No password for Keycloak users
          role: role,
          image: null,
        },
      });
    } else {
      // Update existing user if needed
      if (user.name !== userName || user.role !== role) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userName,
            role: role,
          },
        });
      }
    }

    // Generate JWT token for the user
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
        role: userWithoutPassword.role,
        image: userWithoutPassword.image,
        bio: userWithoutPassword.bio,
        skills: userWithoutPassword.skills,
        hourlyRate: userWithoutPassword.hourlyRate,
        title: userWithoutPassword.title,
        location: userWithoutPassword.location,
        website: userWithoutPassword.website,
        linkedin: userWithoutPassword.linkedin,
        github: userWithoutPassword.github,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Keycloak sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Check if Keycloak is configured
router.get('/status', (req, res) => {
  const keycloak = getKeycloak();
  
  res.json({
    success: true,
    data: {
      configured: !!keycloak,
      authenticated: !!(req.kauth && req.kauth.grant),
    }
  });
});

module.exports = router;

