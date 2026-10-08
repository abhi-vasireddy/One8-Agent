import { env } from '../config/env.js';

export const PORTALS = {
  STUDENT_AGENT: 'student_agent',
  MANAGEMENT_AGENT: 'management_agent',
  ADMIN_PORTAL: 'admin_portal',
};

export class AccessControl {
  /**
   * Determine accessible portals based on assigned roles and super admin status
   * @param {Array} roles - Array of role objects or role names
   * @param {boolean} isSuperAdmin
   * @returns {string[]} List of accessible portal identifiers
   */
  static calculatePortals(roles = [], isSuperAdmin = false) {
    if (isSuperAdmin) {
      return [PORTALS.ADMIN_PORTAL, PORTALS.MANAGEMENT_AGENT, PORTALS.STUDENT_AGENT];
    }

    const portals = new Set();
    const roleNames = (roles || []).map(r => (typeof r === 'string' ? r : r.name || r.roleName || '')).map(s => s.toLowerCase());

    for (const name of roleNames) {
      if (name.includes('super admin') || name.includes('administrator')) {
        portals.add(PORTALS.ADMIN_PORTAL);
        portals.add(PORTALS.MANAGEMENT_AGENT);
        portals.add(PORTALS.STUDENT_AGENT);
      } else if (
        name.includes('admission') ||
        name.includes('officer') ||
        name.includes('dean') ||
        name.includes('faculty') ||
        name.includes('hod') ||
        name.includes('coordinator') ||
        name.includes('advisor') ||
        name.includes('management')
      ) {
        portals.add(PORTALS.MANAGEMENT_AGENT);
      } else if (name.includes('student') || name.includes('applicant')) {
        portals.add(PORTALS.STUDENT_AGENT);
      }
    }

    // Default to student_agent if user has no assigned portal
    if (portals.size === 0) {
      portals.add(PORTALS.STUDENT_AGENT);
    }

    return Array.from(portals);
  }

  /**
   * Get default portal based on configured priority (Admin > Management > Student)
   */
  static getDefaultPortal(portals = []) {
    if (portals.includes(PORTALS.ADMIN_PORTAL)) return PORTALS.ADMIN_PORTAL;
    if (portals.includes(PORTALS.MANAGEMENT_AGENT)) return PORTALS.MANAGEMENT_AGENT;
    return PORTALS.STUDENT_AGENT;
  }

  /**
   * Get frontend path corresponding to a portal
   */
  static getPortalRedirectPath(portal) {
    switch (portal) {
      case PORTALS.ADMIN_PORTAL:
        return '/admin';
      case PORTALS.MANAGEMENT_AGENT:
        return '/board';
      case PORTALS.STUDENT_AGENT:
        return '/agent';
      default:
        return '/agent';
    }
  }

  /**
   * Check if user has permission for a specific portal
   */
  static canAccessPortal(user, portal) {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const userPortals = user.portals || this.calculatePortals(user.roles, user.isSuperAdmin);
    return userPortals.includes(portal);
  }

  /**
   * Compute comprehensive access metadata for user session
   */
  static getUserFullAccess(user) {
    const roles = user.roles || [];
    const isSuperAdmin = Boolean(
      user.isSuperAdmin ||
      roles.some(r => {
        const name = (typeof r === 'string' ? r : r.name || r.roleName || '').toLowerCase();
        return name === 'super admin';
      }) ||
      (env.auth?.tempAdminEmail && user.email?.toLowerCase() === env.auth.tempAdminEmail.toLowerCase())
    );

    const portals = this.calculatePortals(roles, isSuperAdmin);
    const defaultPortal = this.getDefaultPortal(portals);
    const redirectPath = this.getPortalRedirectPath(defaultPortal);

    return {
      isSuperAdmin,
      portals,
      defaultPortal,
      redirectPath,
      roles: roles.map(r => (typeof r === 'string' ? r : r.name || r.roleName || 'User')),
    };
  }
}
