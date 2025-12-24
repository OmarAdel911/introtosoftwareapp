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

// Callback route - manually handles OAuth code exchange (bypasses protect middleware)
router.get('/callback', async (req, res) => {
  const keycloak = getKeycloak();
  
  if (!keycloak) {
    return res.status(503).json({ error: 'Keycloak not configured' });
  }
  
  // Check if we have an authorization code
  const code = req.query.code;
  const error = req.query.error;
  const errorDescription = req.query.error_description;
  const sessionState = req.query.session_state;
  
  if (error) {
    // Authentication error from Keycloak
    console.error('Keycloak callback error:', error, errorDescription);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error&error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`);
  }
  
  if (!code) {
    // No code, this might be a direct access or failed redirect
    console.log('No authorization code in callback. Query params:', req.query);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error&error=no_code`);
  }
  
  try {
    // Manually exchange authorization code for tokens
    const { keycloakConfig } = require('../config/keycloak');
    const axios = require('axios');
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5001';
    const redirectUri = `${protocol}://${host}/api/keycloak/callback`;
    
    // Exchange code for tokens
    const tokenUrl = `${keycloakConfig.serverUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: keycloakConfig.clientId,
      redirect_uri: redirectUri,
    });
    
    // Add client secret if not public client
    if (keycloakConfig.clientSecret) {
      tokenParams.append('client_secret', keycloakConfig.clientSecret);
    }
    
    const tokenResponse = await axios.post(tokenUrl, tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, id_token } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('No access token received from Keycloak');
    }
    
    // Decode the access token to get user info
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(access_token);
    
    if (!decodedToken || !decodedToken.email) {
      throw new Error('Invalid token received from Keycloak');
    }
    
    // Sync user and generate JWT token
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const userEmail = decodedToken.email;
    const userName = decodedToken.name || decodedToken.preferred_username || userEmail.split('@')[0];
    const keycloakRoles = decodedToken.realm_access?.roles || [];

    // Check if this is a new registration (user doesn't exist yet)
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    // Map Keycloak roles to database roles
    let role = 'FREELANCER'; // default
    if (keycloakRoles.includes('admin') || keycloakRoles.includes('ADMIN')) {
      role = 'ADMIN';
    } else if (keycloakRoles.includes('client') || keycloakRoles.includes('CLIENT')) {
      role = 'CLIENT';
    } else if (keycloakRoles.includes('freelancer') || keycloakRoles.includes('FREELANCER')) {
      role = 'FREELANCER';
    }

    if (!user) {
      // Create new user from Keycloak registration
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          password: '', // No password for Keycloak users
          role: role, // Default role, can be updated by frontend if registration data exists
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
    
  } catch (error) {
    console.error('Keycloak callback error:', error);
    console.error('Error details:', error.message, error.response?.data || error.stack);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorMsg = error.response?.data?.error_description || error.message || 'Unknown error';
    res.redirect(`${frontendUrl}/auth/keycloak-callback?auth=error&error=callback_error&error_description=${encodeURIComponent(errorMsg)}`);
  }
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

    // Add client_secret if configured (for confidential clients)
    if (keycloakConfig.clientSecret && !keycloakConfig.publicClient) {
      params.append('client_secret', keycloakConfig.clientSecret);
    }

    try {
      // Get access token from Keycloak
      const tokenResponse = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token } = tokenResponse.data;

      if (!access_token) {
        return res.status(401).json({ error: 'No access token received from Keycloak' });
      }

      // Decode token to get user info
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(access_token);
      
      if (!decoded || !decoded.email) {
        return res.status(401).json({ 
          error: 'Invalid token received from Keycloak',
          details: 'Token does not contain email claim. Make sure email is mapped in Keycloak user attributes.'
        });
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
        const errorData = keycloakError.response?.data;
        const errorDescription = errorData?.error_description || errorData?.error || 'Authentication failed';
        
        // Provide more helpful error messages
        if (errorDescription.includes('invalid_grant') || errorDescription.includes('Invalid user credentials')) {
          return res.status(401).json({ 
            error: 'Invalid email or password',
            details: 'Please check your credentials and try again.'
          });
        } else if (errorDescription.includes('unauthorized_client')) {
          return res.status(401).json({ 
            error: 'Client not authorized',
            details: 'Direct Access Grants must be enabled for this client in Keycloak. Please contact an administrator.'
          });
        } else if (errorDescription.includes('invalid_client')) {
          return res.status(401).json({ 
            error: 'Invalid client configuration',
            details: 'Keycloak client is not properly configured. Please check KEYCLOAK_CLIENT_ID and KEYCLOAK_CLIENT_SECRET in backend .env'
          });
        }
        
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: errorDescription
        });
      }
      
      if (keycloakError.response?.status === 400) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: keycloakError.response?.data?.error_description || keycloakError.response?.data?.error || 'Bad request to Keycloak'
        });
      }
      
      // Check if Keycloak is not reachable
      if (keycloakError.code === 'ECONNREFUSED' || keycloakError.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          error: 'Keycloak server unavailable',
          details: 'Cannot connect to Keycloak. Please ensure Keycloak is running and KEYCLOAK_SERVER_URL is correct.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Authentication failed',
        details: keycloakError.response?.data?.error_description || keycloakError.response?.data?.error || keycloakError.message
      });
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

// Direct registration endpoint (creates user in Keycloak via Admin API, no redirect)
router.post('/direct-register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const { keycloakConfig } = require('../config/keycloak');
    const axios = require('axios');

    // Step 1: Get admin token from Keycloak
    // Note: Default Keycloak admin credentials are admin/admin
    // For production, set KEYCLOAK_ADMIN_USERNAME and KEYCLOAK_ADMIN_PASSWORD in .env
    const adminTokenUrl = `${keycloakConfig.serverUrl}/realms/master/protocol/openid-connect/token`;
    const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
    
    const adminCredentials = {
      grant_type: 'password',
      client_id: 'admin-cli',
      username: adminUsername,
      password: adminPassword,
    };

    let adminToken;
    try {
      const adminTokenResponse = await axios.post(
        adminTokenUrl,
        new URLSearchParams(adminCredentials).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      adminToken = adminTokenResponse.data.access_token;
      
      if (!adminToken) {
        throw new Error('No admin token received from Keycloak');
      }
    } catch (adminError) {
      console.error('Error getting admin token:', adminError.response?.data || adminError.message);
      return res.status(500).json({ 
        error: 'Failed to connect to Keycloak admin API',
        message: adminError.response?.data?.error_description || 'Please verify Keycloak admin credentials. Default: admin/admin'
      });
    }

    // Step 2: Create user in Keycloak via Admin API
    const createUserUrl = `${keycloakConfig.serverUrl}/admin/realms/${keycloakConfig.realm}/users`;
    const keycloakUserData = {
      username: email,
      email: email,
      firstName: firstName,
      lastName: lastName,
      enabled: true,
      emailVerified: false, // Set to true if you want to skip email verification
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    };

    let keycloakUserId;
    try {
      const createUserResponse = await axios.post(createUserUrl, keycloakUserData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Get user ID from Location header
      const locationHeader = createUserResponse.headers.location;
      if (locationHeader) {
        keycloakUserId = locationHeader.split('/').pop();
      } else {
        // If no location header, fetch user by email
        const getUserUrl = `${keycloakConfig.serverUrl}/admin/realms/${keycloakConfig.realm}/users?email=${encodeURIComponent(email)}`;
        const getUserResponse = await axios.get(getUserUrl, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });
        if (getUserResponse.data && getUserResponse.data.length > 0) {
          keycloakUserId = getUserResponse.data[0].id;
        }
      }
    } catch (createError) {
      console.error('Error creating user in Keycloak:', createError.response?.data || createError.message);
      if (createError.response?.status === 409) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      return res.status(500).json({ 
        error: 'Failed to create user in Keycloak',
        message: createError.response?.data?.errorMessage || createError.message
      });
    }

    // Step 3: Assign role to user in Keycloak
    if (keycloakUserId && role) {
      try {
        // Get realm role ID
        const roleName = role.toUpperCase(); // FREELANCER, CLIENT, ADMIN
        const getRoleUrl = `${keycloakConfig.serverUrl}/admin/realms/${keycloakConfig.realm}/roles/${roleName}`;
        const roleResponse = await axios.get(getRoleUrl, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });

        if (roleResponse.data) {
          // Assign role to user
          const assignRoleUrl = `${keycloakConfig.serverUrl}/admin/realms/${keycloakConfig.realm}/users/${keycloakUserId}/role-mappings/realm`;
          await axios.post(
            assignRoleUrl,
            [roleResponse.data],
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      } catch (roleError) {
        console.error('Error assigning role:', roleError.response?.data || roleError.message);
        // Continue even if role assignment fails - user will have default role
      }
    }

    // Step 4: Create user in database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const userName = `${firstName} ${lastName}`;
    const dbRole = role || 'FREELANCER';

    let user;
    try {
      // Check if user already exists
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // User exists, update it
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userName,
            role: dbRole,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name: userName,
            password: '', // No password for Keycloak users
            role: dbRole,
            image: null,
          },
        });
      }
    } catch (dbError) {
      console.error('Error creating user in database:', dbError);
      return res.status(500).json({ error: 'Failed to create user in database' });
    }

    // Step 5: Log user in automatically using direct-login
    try {
      const tokenUrl = `${keycloakConfig.serverUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
      const tokenParams = new URLSearchParams({
        grant_type: 'password',
        client_id: keycloakConfig.clientId,
        username: email,
        password: password,
        scope: 'openid profile email',
      });

      const tokenResponse = await axios.post(tokenUrl, tokenParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = tokenResponse.data;
      const jwt = require('jsonwebtoken');

      // Generate JWT token for the user
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Registration successful',
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
    } catch (loginError) {
      console.error('Error logging in after registration:', loginError.response?.data || loginError.message);
      // User created but login failed - return success but indicate login needed
      return res.status(201).json({
        success: true,
        message: 'User created successfully. Please log in.',
        requiresLogin: true,
      });
    }
  } catch (error) {
    console.error('Direct registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message || 'Unknown error occurred'
    });
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

