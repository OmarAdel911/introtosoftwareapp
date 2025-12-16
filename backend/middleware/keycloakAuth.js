const { PrismaClient } = require('@prisma/client');
const { getKeycloak } = require('../config/keycloak');

const prisma = new PrismaClient();

/**
 * Hybrid Authentication Middleware
 * 
 * Supports both Keycloak and custom JWT authentication
 * Priority: Keycloak > Custom JWT
 */

const keycloakAuth = async (req, res, next) => {
  try {
    const keycloak = getKeycloak();
    
    // Check if Keycloak is configured and user is authenticated via Keycloak
    if (keycloak && req.kauth && req.kauth.grant) {
      // User authenticated via Keycloak
      const keycloakUser = req.kauth.grant.access_token.content;
      
      // Map Keycloak user to your database user
      let user = await prisma.user.findUnique({
        where: { email: keycloakUser.email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });

      // If user doesn't exist in database, create it from Keycloak
      if (!user && keycloakUser.email) {
        // Map Keycloak roles to your roles
        const keycloakRoles = keycloakUser.realm_access?.roles || [];
        let role = 'FREELANCER'; // default
        
        if (keycloakRoles.includes('admin') || keycloakRoles.includes('ADMIN')) {
          role = 'ADMIN';
        } else if (keycloakRoles.includes('client') || keycloakRoles.includes('CLIENT')) {
          role = 'CLIENT';
        } else if (keycloakRoles.includes('freelancer') || keycloakRoles.includes('FREELANCER')) {
          role = 'FREELANCER';
        }

        // Create user in database
        user = await prisma.user.create({
          data: {
            email: keycloakUser.email,
            name: keycloakUser.name || keycloakUser.preferred_username || keycloakUser.email.split('@')[0],
            password: '', // No password needed for Keycloak users
            role: role,
            image: null,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        });
      }

      if (user) {
        req.user = user;
        req.authMethod = 'keycloak';
        req.keycloakToken = req.kauth.grant.access_token;
        return next();
      }
    }

    // Fallback to custom JWT authentication
    const jwt = require('jsonwebtoken');
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Invalid token format' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      req.authMethod = 'jwt';
      req.token = token;
      next();
    } catch (jwtError) {
      // If JWT fails and Keycloak is not configured, return error
      if (!keycloak) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      // If Keycloak is configured but JWT fails, try Keycloak protection
      return res.status(401).json({ error: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Keycloak auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = keycloakAuth;

