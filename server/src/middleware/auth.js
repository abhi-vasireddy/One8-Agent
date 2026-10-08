import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { AccessControl } from '../services/access-control.js';

/**
 * JWT Authentication Middleware
 * Verifies Supabase/JWT tokens, verifies active status, and attaches user + portals to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch (err) {
      if (env.isDev) {
        decoded = jwt.decode(token);
        if (!decoded) {
          throw new UnauthorizedError('Invalid authorization token');
        }
      } else {
        throw new UnauthorizedError('Invalid or expired token');
      }
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      throw new UnauthorizedError('Invalid token subject');
    }

    // Check user active status in database
    const { data: dbUser, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, email, name, phone, college_id, is_active, metadata')
      .eq('id', userId)
      .maybeSingle();

    if (uErr || !dbUser) {
      // If user row not found, verify if decoded email exists
      if (!decoded.email) {
        throw new UnauthorizedError('User account not found');
      }
    }

    // Check active status
    if (dbUser && dbUser.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact your administrator.',
      });
    }

    // Resolve user roles from user_roles table or token payload
    let roles = [];
    if (dbUser) {
      const { data: userRoleMappings } = await supabaseAdmin
        .from('user_roles')
        .select('role_id, branch_id, pipeline_id, roles(id, name, is_system)')
        .eq('user_id', dbUser.id);

      if (userRoleMappings && userRoleMappings.length > 0) {
        roles = userRoleMappings.map(ur => ({
          id: ur.role_id,
          name: ur.roles?.name || 'User',
          branchId: ur.branch_id,
          pipelineId: ur.pipeline_id,
          isSystem: ur.roles?.is_system || false,
        }));
      }
    }

    if (roles.length === 0 && decoded.roles) {
      roles = (decoded.roles || []).map(r => ({
        id: r.id || 'default-role-id',
        name: r.name || r.roleName || 'User',
        isSystem: r.isSystem || false,
      }));
    }

    const isSuperAdmin = Boolean(
      decoded.isSuperAdmin === true ||
      (env.auth.tempAdminEmail && (dbUser?.email?.toLowerCase() === env.auth.tempAdminEmail.toLowerCase() || decoded.email?.toLowerCase() === env.auth.tempAdminEmail.toLowerCase())) ||
      roles.some(r => r.name === 'Super Admin')
    );

    const portals = AccessControl.calculatePortals(roles, isSuperAdmin);
    const defaultPortal = AccessControl.getDefaultPortal(portals);
    const redirectPath = AccessControl.getPortalRedirectPath(defaultPortal);

    req.user = {
      id: dbUser?.id || userId,
      authId: dbUser?.auth_id || decoded.authId,
      email: dbUser?.email || decoded.email,
      name: dbUser?.name || decoded.name || 'User',
      collegeId: dbUser?.college_id || decoded.collegeId || '11111111-1111-1111-1111-111111111111',
      isActive: dbUser?.is_active ?? true,
      roles,
      isSuperAdmin,
      portals,
      defaultPortal,
      redirectPath,
    };
    req.token = token;

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ success: false, message: err.message });
    }
    if (err instanceof ForbiddenError) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, next);
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roleNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.isSuperAdmin) return next(); // Super Admin bypasses

    const userRoleNames = (req.user.roles || []).map(r => (r.name || r.roleName || '').toLowerCase());
    const hasRole = roleNames.some(name => userRoleNames.includes(name.toLowerCase()));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions for this action' });
    }
    next();
  };
};

/**
 * Require specific portal access (e.g. 'admin_portal', 'management_agent', 'student_agent')
 */
export const requirePortal = (portalName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.isSuperAdmin) return next();

    const allowed = AccessControl.canAccessPortal(req.user, portalName);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Access restricted: your account does not have access to the ${portalName}`,
      });
    }
    next();
  };
};
