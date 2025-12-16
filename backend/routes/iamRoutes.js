const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole, PERMISSIONS, ROLE_PERMISSIONS } = require('../middleware/iam');
const { getUserPermissions } = require('../utils/permissions');

/**
 * Get current user's permissions
 * Useful for frontend to determine what actions are available
 */
router.get('/me/permissions', auth, (req, res) => {
  try {
    const userPermissions = getUserPermissions(req.user.role);
    res.json({
      success: true,
      data: {
        role: req.user.role,
        permissions: userPermissions.permissions,
        permissionsCount: userPermissions.permissions.length,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check if user has specific permission
 */
router.post('/check-permission', auth, (req, res) => {
  try {
    const { permission } = req.body;
    
    if (!permission) {
      return res.status(400).json({ error: 'Permission is required' });
    }

    const { hasPermission } = require('../middleware/iam');
    const hasAccess = hasPermission(req.user.role, permission);

    res.json({
      success: true,
      data: {
        permission,
        hasAccess,
        role: req.user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all available permissions (Admin only)
 */
router.get('/permissions', auth, requireRole('ADMIN'), (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        permissions: PERMISSIONS,
        rolePermissions: ROLE_PERMISSIONS,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get permissions for a specific role
 */
router.get('/role/:role/permissions', auth, requireRole('ADMIN'), (req, res) => {
  try {
    const { role } = req.params;
    const permissions = ROLE_PERMISSIONS[role] || [];

    res.json({
      success: true,
      data: {
        role,
        permissions,
        permissionsCount: permissions.length,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

