/**
 * Permission utility functions
 * Helper functions for checking permissions in business logic
 */

const { PERMISSIONS, ROLE_PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions } = require('../middleware/iam');

/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can perform an action
 */
function canPerformAction(role, permission) {
  return hasPermission(role, permission);
}

/**
 * Get user's effective permissions
 * Useful for frontend to show/hide UI elements
 */
function getUserPermissions(userRole) {
  return {
    role: userRole,
    permissions: getRolePermissions(userRole),
    can: (permission) => hasPermission(userRole, permission),
    canAny: (...permissions) => hasAnyPermission(userRole, permissions),
    canAll: (...permissions) => hasAllPermissions(userRole, permissions),
  };
}

/**
 * Filter resources based on user permissions
 */
function filterByPermissions(resources, userRole, requiredPermission) {
  if (hasPermission(userRole, requiredPermission)) {
    return resources;
  }
  return [];
}

module.exports = {
  getRolePermissions,
  canPerformAction,
  getUserPermissions,
  filterByPermissions,
  PERMISSIONS,
};

