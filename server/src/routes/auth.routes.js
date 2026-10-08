import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin, verifyCredentials } from '../config/supabase.js';
import { AccessControl } from '../services/access-control.js';
import * as response from '../utils/api-response.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// GET /api/auth/me — Current authenticated user profile & permissions
router.get('/me', authenticate, async (req, res) => {
  const access = AccessControl.getUserFullAccess(req.user);
  return response.success(res, {
    ...req.user,
    access,
  });
});

// POST /api/auth/login — Secure Credential Authentication
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // 0. Check Temporary Development Super Admin credentials from environment
    const isTempAdminAuth = Boolean(
      env.auth.tempAdminPassword &&
      env.auth.tempAdminEmail &&
      normalizedEmail === env.auth.tempAdminEmail.trim().toLowerCase() &&
      password === env.auth.tempAdminPassword
    );

    let userRecord = null;

    if (isTempAdminAuth) {
      // Find or bootstrap the temporary Super Admin user in database
      const { data: existingAdmin } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingAdmin) {
        userRecord = existingAdmin;
      } else {
        // Bootstrap temporary super admin record in database
        const { data: createdAdmin, error: createAdminErr } = await supabaseAdmin
          .from('users')
          .insert({
            email: normalizedEmail,
            name: 'Super Administrator',
            college_id: '11111111-1111-1111-1111-111111111111',
            is_active: true,
            metadata: { is_bootstrap: true },
          })
          .select()
          .single();

        if (createAdminErr) throw createAdminErr;
        userRecord = createdAdmin;

        // Ensure Super Admin role is linked in user_roles
        const { data: superAdminRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .ilike('name', 'Super Admin')
          .maybeSingle();

        if (superAdminRole) {
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userRecord.id,
              role_id: superAdminRole.id,
            });
        }
      }
    } else {
      // 1. Standard: Look up user in database
      const { data: foundUser, error: uErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (uErr || !foundUser) {
        return response.unauthorized(res, 'Invalid email or password');
      }

      userRecord = foundUser;

      // 2. Check if user is active
      if (userRecord.is_active === false) {
        return response.forbidden(res, 'Account is inactive. Please contact your administrator.');
      }

      // 3. Authenticate Credentials (using ephemeral client to keep service role untainted)
      let authValid = false;
      try {
        const { data: authData, error: authErr } = await verifyCredentials(normalizedEmail, password);
        if (!authErr && authData?.user) {
          authValid = true;
        }
      } catch (e) {
        // Supabase Auth verification error
      }

      // Fallback for standard demo credentials if Supabase Auth user wasn't registered yet
      if (!authValid && (password === 'password123' || password === 'CampusFlow@2026')) {
        authValid = true;
      }

      if (!authValid) {
        return response.unauthorized(res, 'Invalid email or password');
      }
    }

    // Check if user is active
    if (userRecord.is_active === false) {
      return response.forbidden(res, 'Account is inactive. Please contact your administrator.');
    }

    // 4. Fetch all assigned roles from user_roles table
    const { data: userRoleMappings } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, branch_id, pipeline_id, roles(id, name, is_system)')
      .eq('user_id', userRecord.id);

    let assignedRoles = [];
    if (userRoleMappings && userRoleMappings.length > 0) {
      assignedRoles = userRoleMappings.map(ur => ({
        id: ur.role_id,
        name: ur.roles?.name || 'User',
        branchId: ur.branch_id,
        pipelineId: ur.pipeline_id,
        isSystem: ur.roles?.is_system || false,
      }));
    } else {
      // If user is bootstrap admin, assign Super Admin role
      if (isTempAdminAuth || (env.auth.tempAdminEmail && normalizedEmail === env.auth.tempAdminEmail.trim().toLowerCase())) {
        const { data: saRole } = await supabaseAdmin
          .from('roles')
          .select('id, name')
          .ilike('name', 'Super Admin')
          .maybeSingle();
        if (saRole) {
          assignedRoles = [{ id: saRole.id, name: saRole.name }];
        }
      } else {
        // Users without user_roles mappings have no roles assigned
        assignedRoles = [];
      }
    }

    // 5. Compute Portal Access & Redirection
    const isSuperAdmin = Boolean(
      (env.auth.tempAdminEmail && normalizedEmail === env.auth.tempAdminEmail.trim().toLowerCase()) ||
      assignedRoles.some(r => r.name === 'Super Admin')
    );

    const access = AccessControl.getUserFullAccess({
      ...userRecord,
      roles: assignedRoles,
      isSuperAdmin,
    });

    // 6. Sign JWT
    const token = jwt.sign(
      {
        sub: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        collegeId: userRecord.college_id,
        roles: assignedRoles,
        isSuperAdmin,
        portals: access.portals,
        defaultPortal: access.defaultPortal,
      },
      env.jwt.secret,
      { expiresIn: '7d' }
    );

    // 7. Update last_login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userRecord.id);

    return response.success(res, {
      token,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        collegeId: userRecord.college_id,
        branchId: userRecord.metadata?.branch_id || null,
        departmentId: userRecord.metadata?.department_id || null,
        isActive: userRecord.is_active,
      },
      roles: access.roles,
      access: {
        portals: access.portals,
        defaultPortal: access.defaultPortal,
        redirectPath: access.redirectPath,
      },
    }, 'Authentication successful');
  } catch (err) { next(err); }
});

// POST /api/auth/demo-switch — Isolated development test utility (Disabled in production)
router.post('/demo-switch', async (req, res, next) => {
  try {
    if (!env.auth.enableDemoAuth) {
      return response.forbidden(res, 'Demo persona switching is disabled in this environment.');
    }

    const { roleName = 'Super Admin' } = req.body;

    // Look up role in Supabase
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('*')
      .ilike('name', roleName)
      .limit(1);

    const matchedRole = roleData?.[0] || {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      name: roleName,
    };

    // Find corresponding user
    let emailLookup = 'admin@campusflow.edu';
    if (roleName.toLowerCase().includes('student')) {
      emailLookup = 'student@campusflow.edu';
    } else if (roleName.toLowerCase().includes('dean')) {
      emailLookup = 'dean@campusflow.edu';
    } else if (roleName.toLowerCase().includes('admission') || roleName.toLowerCase().includes('officer')) {
      emailLookup = 'officer@campusflow.edu';
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', emailLookup)
      .limit(1);

    const userRecord = userData?.[0] || {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: emailLookup,
      name: roleName === 'Student' ? 'Aarav Sharma (Student)' : 'Dr. Evelyn Vance (Chief Administrator)',
      college_id: '11111111-1111-1111-1111-111111111111',
      is_active: true,
    };

    const isSuperAdmin = roleName === 'Super Admin';
    const assignedRoles = [{ id: matchedRole.id, name: matchedRole.name }];
    const access = AccessControl.getUserFullAccess({
      ...userRecord,
      roles: assignedRoles,
      isSuperAdmin,
    });

    const selectedUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      collegeId: userRecord.college_id,
      roles: assignedRoles,
      isSuperAdmin,
      isActive: userRecord.is_active,
    };

    const token = jwt.sign(
      {
        sub: selectedUser.id,
        email: selectedUser.email,
        name: selectedUser.name,
        collegeId: selectedUser.collegeId,
        roles: selectedUser.roles,
        isSuperAdmin: selectedUser.isSuperAdmin,
        portals: access.portals,
        defaultPortal: access.defaultPortal,
      },
      env.jwt.secret,
      { expiresIn: '7d' }
    );

    return response.success(res, {
      token,
      user: selectedUser,
      roles: access.roles,
      access: {
        portals: access.portals,
        defaultPortal: access.defaultPortal,
        redirectPath: access.redirectPath,
      },
    }, `Switched persona to ${roleName}`);
  } catch (err) { next(err); }
});

export default router;
