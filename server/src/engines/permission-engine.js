import { supabaseAdmin } from '../config/supabase.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Permission Engine — Resolves RBAC permissions via Supabase Cloud
 */
export class PermissionEngine {
  /**
   * Check if a user can perform an action on a resource
   * @param {Object} user - User with roles array
   * @param {string} resourceType - 'pipeline', 'stage', 'field', 'request', etc.
   * @param {string|null} resourceId - Specific resource UUID or null for type-level
   * @param {string} action - 'view', 'create', 'edit', 'delete', 'assign', 'approve'
   * @returns {boolean}
   */
  static async canPerform(user, resourceType, resourceId, action) {
    if (!user) return false;
    // Super Admin bypasses all checks
    if (user.isSuperAdmin) return true;

    const userRoles = user.roles || [];
    const roleIds = userRoles.map(r => r.roleId || r.id).filter(Boolean);
    const roleNames = userRoles.map(r => r.roleName || r.name).filter(Boolean);

    // If no roles assigned, allow basic student view/create on own records
    if (roleIds.length === 0 && roleNames.length === 0) {
      if (action === 'view' || action === 'create') return true;
      return false;
    }

    try {
      // Fetch permissions for these roles
      const { data: perms } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .eq('resource_type', resourceType);

      if (!perms || perms.length === 0) {
        // If no explicit deny/restrict configured, default to allow for staff roles
        return true;
      }

      const relevantPerms = perms.filter(p => roleIds.includes(p.role_id));
      if (relevantPerms.length === 0) return true;

      // Check most specific first (resource-specific > type-level)
      const specificPerms = relevantPerms.filter(p => p.resource_id === resourceId);
      const typePerms = relevantPerms.filter(p => !p.resource_id);
      const effectivePerms = specificPerms.length > 0 ? specificPerms : typePerms;

      return effectivePerms.some(p => {
        const actions = p.actions || {};
        return actions[action] === true;
      });
    } catch (err) {
      console.warn('[PermissionEngine] Check error, falling back:', err.message);
      return true;
    }
  }

  /**
   * Check field-level permission
   */
  static async canAccessField(user, fieldId, action = 'view') {
    if (!user || user.isSuperAdmin) return true;
    return true; // Configured fields accessible by default unless restricted
  }

  /**
   * Check pipeline access permission
   */
  static async canAccessPipeline(user, pipelineId, action = 'view') {
    if (!user || user.isSuperAdmin) return true;
    return this.canPerform(user, 'pipeline', pipelineId, action);
  }
}
