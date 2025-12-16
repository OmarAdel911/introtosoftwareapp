const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * IAM (Identity and Access Management) System
 * 
 * This middleware provides fine-grained access control based on:
 * - User roles (ADMIN, FREELANCER, CLIENT)
 * - Resource ownership
 * - Permissions
 */

// Permission definitions
const PERMISSIONS = {
  // Job permissions
  JOB_CREATE: 'job:create',
  JOB_READ: 'job:read',
  JOB_UPDATE: 'job:update',
  JOB_DELETE: 'job:delete',
  JOB_MANAGE_ALL: 'job:manage_all',
  
  // Proposal permissions
  PROPOSAL_CREATE: 'proposal:create',
  PROPOSAL_READ: 'proposal:read',
  PROPOSAL_UPDATE: 'proposal:update',
  PROPOSAL_DELETE: 'proposal:delete',
  PROPOSAL_ACCEPT: 'proposal:accept',
  PROPOSAL_REJECT: 'proposal:reject',
  
  // Contract permissions
  CONTRACT_CREATE: 'contract:create',
  CONTRACT_READ: 'contract:read',
  CONTRACT_UPDATE: 'contract:update',
  CONTRACT_DELETE: 'contract:delete',
  CONTRACT_ACCEPT: 'contract:accept',
  CONTRACT_SUBMIT: 'contract:submit',
  
  // User permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ALL: 'user:manage_all',
  
  // Payment permissions
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_READ: 'payment:read',
  PAYMENT_UPDATE: 'payment:update',
  PAYMENT_APPROVE: 'payment:approve',
  
  // Portfolio permissions
  PORTFOLIO_CREATE: 'portfolio:create',
  PORTFOLIO_READ: 'portfolio:read',
  PORTFOLIO_UPDATE: 'portfolio:update',
  PORTFOLIO_DELETE: 'portfolio:delete',
  
  // Admin permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_USERS: 'admin:users',
  ADMIN_JOBS: 'admin:jobs',
  ADMIN_PAYMENTS: 'admin:payments',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_ANALYTICS: 'admin:analytics',
  
  // Connect permissions
  CONNECT_READ: 'connect:read',
  CONNECT_PURCHASE: 'connect:purchase',
  CONNECT_MANAGE: 'connect:manage',
  
  // Notification permissions
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETE: 'notification:delete',
  NOTIFICATION_MANAGE_ALL: 'notification:manage_all',
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  ADMIN: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  
  CLIENT: [
    // Job management
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_READ,
    PERMISSIONS.JOB_UPDATE,
    PERMISSIONS.JOB_DELETE,
    
    // Proposal management
    PERMISSIONS.PROPOSAL_READ,
    PERMISSIONS.PROPOSAL_ACCEPT,
    PERMISSIONS.PROPOSAL_REJECT,
    
    // Contract management
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.CONTRACT_ACCEPT,
    
    // User management (own profile)
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    
    // Payment management
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    
    // Notifications
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_DELETE,
  ],
  
  FREELANCER: [
    // Job viewing
    PERMISSIONS.JOB_READ,
    
    // Proposal management
    PERMISSIONS.PROPOSAL_CREATE,
    PERMISSIONS.PROPOSAL_READ,
    PERMISSIONS.PROPOSAL_UPDATE,
    PERMISSIONS.PROPOSAL_DELETE,
    
    // Contract management
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.CONTRACT_SUBMIT,
    
    // User management (own profile)
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    
    // Portfolio management
    PERMISSIONS.PORTFOLIO_CREATE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.PORTFOLIO_UPDATE,
    PERMISSIONS.PORTFOLIO_DELETE,
    
    // Payment viewing
    PERMISSIONS.PAYMENT_READ,
    
    // Connect management
    PERMISSIONS.CONNECT_READ,
    PERMISSIONS.CONNECT_PURCHASE,
    
    // Notifications
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_DELETE,
  ],
};

/**
 * Check if user has a specific permission
 */
function hasPermission(userRole, permission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
function hasAnyPermission(userRole, permissions) {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
function hasAllPermissions(userRole, permissions) {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Middleware to check if user has required permission
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!hasPermission(req.user.role, permission)) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `You don't have permission to perform this action. Required: ${permission}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to check if user has any of the required permissions
 */
function requireAnyPermission(...permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!hasAnyPermission(req.user.role, permissions)) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `You don't have permission to perform this action. Required: ${permissions.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to check if user has all required permissions
 */
function requireAllPermissions(...permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!hasAllPermissions(req.user.role, permissions)) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `You don't have permission to perform this action. Required: ${permissions.join(' and ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to check resource ownership
 * Use this when a user should only access their own resources
 */
function requireOwnership(resourceModel, resourceIdParam = 'id', userIdField = 'userId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Admin can access all resources
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      // Check ownership
      const resource = await prisma[resourceModel].findUnique({
        where: { id: resourceId },
        select: { [userIdField]: true }
      });

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check if user owns the resource or if it's a job, check if user is the client
      if (resourceModel === 'job') {
        const job = await prisma.job.findUnique({
          where: { id: resourceId },
          select: { clientId: true }
        });
        
        if (job.clientId !== req.user.id) {
          return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
        }
      } else if (resource[userIdField] !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to check if user is owner OR has permission
 * Useful for resources that can be accessed by owner or users with specific permissions
 */
function requireOwnershipOrPermission(permission, resourceModel, resourceIdParam = 'id', userIdField = 'userId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Admin always has access
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Check if user has permission
      if (hasPermission(req.user.role, permission)) {
        return next();
      }

      // Check ownership
      const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      const resource = await prisma[resourceModel].findUnique({
        where: { id: resourceId },
        select: { [userIdField]: true }
      });

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource[userIdField] !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You must own this resource or have the required permission'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership or permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to restrict access to specific roles
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `This endpoint is only accessible to: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnership,
  requireOwnershipOrPermission,
  requireRole,
};

