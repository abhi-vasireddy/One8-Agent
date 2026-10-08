import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../config/supabase.js';
import { authenticate, requirePortal, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { AuditEngine } from '../../engines/audit-engine.js';
import { AccessControl } from '../../services/access-control.js';
import { env } from '../../config/env.js';
import * as response from '../../utils/api-response.js';

const router = Router();

// Protect ALL admin user routes: requires valid authentication, admin_portal access, and Super Admin role
router.use(authenticate);
router.use(requirePortal('admin_portal'));
router.use(requireRole('Super Admin'));

// Helper: Count active Super Admins for last admin protection
async function countActiveSuperAdmins() {
  const { data: superAdminRole } = await supabaseAdmin
    .from('roles')
    .select('id')
    .ilike('name', 'Super Admin')
    .maybeSingle();

  if (!superAdminRole) return 1;

  const { data: mappings } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, users(id, is_active, email)')
    .eq('role_id', superAdminRole.id);

  const activeAdminIds = new Set();
  (mappings || []).forEach(m => {
    if (m.users && m.users.is_active !== false) {
      activeAdminIds.add(m.users.id);
    }
  });

  return activeAdminIds.size;
}

// Helper: Check if specific user is Super Admin
async function isUserSuperAdmin(userId) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, metadata')
    .eq('id', userId)
    .maybeSingle();

  if (user && (
    (env.auth.tempAdminEmail && user.email?.toLowerCase() === env.auth.tempAdminEmail.toLowerCase()) ||
    user.metadata?.is_bootstrap === true
  )) {
    return true;
  }

  const { data: superAdminRole } = await supabaseAdmin
    .from('roles')
    .select('id')
    .ilike('name', 'Super Admin')
    .maybeSingle();

  if (!superAdminRole) return false;

  const { data: mapping } = await supabaseAdmin
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role_id', superAdminRole.id)
    .maybeSingle();

  return Boolean(mapping);
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().default('CampusFlow@2026'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().nullable(),
  userType: z.enum(['Student', 'Management']).optional(),
  roleId: z.string().uuid().optional(),
  roleName: z.string().optional(),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  collegeId: z.string().uuid().optional().default('11111111-1111-1111-1111-111111111111'),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const changeRoleSchema = z.object({
  roleId: z.string().uuid().optional(),
  roleName: z.string().optional(),
  branchId: z.string().uuid().optional().nullable(),
});

// ─────────────────────────────────────────────────────────────
// 1. GET /api/admin/users — List all users with filters & roles
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { search, role, status, type, branch, department } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== undefined && status !== 'all') {
      query = query.eq('is_active', status === 'active' || status === 'true');
    }

    const { data: usersList, error: uErr } = await query;
    if (uErr) throw uErr;

    // Fetch user roles
    const userIds = (usersList || []).map(u => u.id);
    let rolesMap = {};

    if (userIds.length > 0) {
      const { data: urData } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role_id, roles(id, name, is_system)')
        .in('user_id', userIds);

      (urData || []).forEach(ur => {
        if (!rolesMap[ur.user_id]) rolesMap[ur.user_id] = [];
        if (ur.roles) {
          rolesMap[ur.user_id].push({
            id: ur.role_id,
            name: ur.roles.name,
            isSystem: ur.roles.is_system,
          });
        }
      });
    }

    // Fetch branch and department references for display names
    const [branchesRes, deptsRes] = await Promise.all([
      supabaseAdmin.from('branches').select('id, name, code'),
      supabaseAdmin.from('departments').select('id, name, code'),
    ]);
    const branchNameMap = {};
    (branchesRes.data || []).forEach(b => { branchNameMap[b.id] = b.name; });
    const deptNameMap = {};
    (deptsRes.data || []).forEach(d => { deptNameMap[d.id] = d.name; });

    let formatted = (usersList || []).map(u => {
      const assignedRoles = rolesMap[u.id] || [];
      const access = AccessControl.getUserFullAccess({ ...u, roles: assignedRoles });
      
      const isStudent = assignedRoles.some(r => (r.name || '').toLowerCase() === 'student') || u.metadata?.user_type === 'Student';
      const userType = isStudent ? 'Student' : 'Management';

      const branchId = u.metadata?.branch_id || null;
      const departmentId = u.metadata?.department_id || null;

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone || null,
        collegeId: u.college_id,
        userType,
        branchId,
        branchName: branchId ? (branchNameMap[branchId] || branchId) : null,
        departmentId,
        departmentName: departmentId ? (deptNameMap[departmentId] || departmentId) : null,
        isActive: u.is_active,
        roles: assignedRoles,
        portals: access.portals,
        defaultPortal: access.defaultPortal,
        redirectPath: access.redirectPath,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        metadata: u.metadata || {},
      };
    });

    // Client search filter
    if (search) {
      const s = String(search).toLowerCase();
      formatted = formatted.filter(u => 
        u.name?.toLowerCase().includes(s) || 
        u.email?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s)
      );
    }

    // User Type filter (Student vs Management)
    if (type && type !== 'all') {
      formatted = formatted.filter(u => u.userType.toLowerCase() === String(type).toLowerCase());
    }

    // Role filter
    if (role && role !== 'all') {
      formatted = formatted.filter(u => u.roles.some(r => r.name?.toLowerCase() === String(role).toLowerCase()));
    }

    // Branch filter
    if (branch && branch !== 'all') {
      formatted = formatted.filter(u => u.branchId === branch || u.branchName?.toLowerCase() === String(branch).toLowerCase());
    }

    // Department filter
    if (department && department !== 'all') {
      formatted = formatted.filter(u => u.departmentId === department || u.departmentName?.toLowerCase() === String(department).toLowerCase());
    }

    return response.success(res, formatted);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 2. POST /api/admin/users — Create new user with credentials & role
// ─────────────────────────────────────────────────────────────
router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const { email, password, name, phone, userType, roleId, roleName, branchId, departmentId, collegeId, isActive } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return response.badRequest(res, 'A user with this email address already exists');
    }

    // 1. Create in Supabase Auth
    let authId = null;
    try {
      const { data: authCreated, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (!authErr && authCreated?.user) {
        authId = authCreated.user.id;
      }
    } catch (authEx) {
      console.warn('[AdminUsers] Supabase Auth creation note:', authEx.message);
    }

    // Determine derived user type
    const determinedType = userType || (roleName?.toLowerCase() === 'student' ? 'Student' : 'Management');

    // 2. Insert into public.users
    const { data: newUser, error: createErr } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authId,
        email: normalizedEmail,
        name,
        phone: phone || null,
        college_id: collegeId,
        is_active: isActive !== false,
        metadata: {
          user_type: determinedType,
          branch_id: branchId || null,
          department_id: departmentId || null,
        },
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // 3. Resolve & Assign Role
    let assignedRole = null;
    let targetRoleId = roleId;

    if (!targetRoleId && roleName) {
      const { data: foundRole } = await supabaseAdmin
        .from('roles')
        .select('*')
        .ilike('name', roleName)
        .maybeSingle();
      if (foundRole) targetRoleId = foundRole.id;
    } else if (!targetRoleId && determinedType === 'Student') {
      const { data: studentRole } = await supabaseAdmin
        .from('roles')
        .select('*')
        .ilike('name', 'Student')
        .maybeSingle();
      if (studentRole) targetRoleId = studentRole.id;
    }

    if (targetRoleId) {
      const { error: roleAssignErr } = await supabaseAdmin.from('user_roles').insert({
        user_id: newUser.id,
        role_id: targetRoleId,
        branch_id: branchId || null,
      });

      if (roleAssignErr) {
        // Rollback user creation to avoid leaving a half-configured account
        await supabaseAdmin.from('users').delete().eq('id', newUser.id);
        if (authId) {
          try { await supabaseAdmin.auth.admin.deleteUser(authId); } catch (_) {}
        }
        throw new Error(`Failed to assign role to user: ${roleAssignErr.message}`);
      }

      const { data: roleRow } = await supabaseAdmin
        .from('roles')
        .select('id, name')
        .eq('id', targetRoleId)
        .maybeSingle();
      assignedRole = roleRow;
    }

    // 4. Audit Log
    await AuditEngine.log({
      userId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: newUser.id,
      newValue: { email: newUser.email, name: newUser.name, userType: determinedType, role: assignedRole?.name },
    });

    const access = AccessControl.getUserFullAccess({
      ...newUser,
      roles: assignedRole ? [assignedRole] : [],
    });

    return response.created(res, {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      collegeId: newUser.college_id,
      userType: determinedType,
      branchId,
      departmentId,
      isActive: newUser.is_active,
      roles: assignedRole ? [assignedRole] : [],
      portals: access.portals,
      defaultPortal: access.defaultPortal,
      redirectPath: access.redirectPath,
      createdAt: newUser.created_at,
    }, 'User created successfully');
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 3. GET /api/admin/users/:id — Get user details & audit logs
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !user) return response.notFound(res, 'User not found');

    const { data: userRolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, branch_id, roles(id, name, is_system)')
      .eq('user_id', user.id);

    const roles = (userRolesData || []).map(ur => ({
      id: ur.role_id,
      name: ur.roles?.name || 'User',
      branchId: ur.branch_id,
    }));

    const isStudent = roles.some(r => (r.name || '').toLowerCase() === 'student') || user.metadata?.user_type === 'Student';
    const userType = isStudent ? 'Student' : 'Management';

    const access = AccessControl.getUserFullAccess({ ...user, roles });

    // Fetch recent audit logs for this user
    const { data: recentAudit } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .or(`entity_id.eq.${user.id},user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    return response.success(res, {
      ...user,
      userType,
      branchId: user.metadata?.branch_id || null,
      departmentId: user.metadata?.department_id || null,
      roles,
      portals: access.portals,
      defaultPortal: access.defaultPortal,
      redirectPath: access.redirectPath,
      auditLogs: recentAudit || [],
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 4. PUT /api/admin/users/:id — Update user profile
// ─────────────────────────────────────────────────────────────
router.put('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    const { name, phone, branchId, departmentId, isActive, metadata } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!existing) return response.notFound(res, 'User not found');

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);

    const mergedMetadata = {
      ...(existing.metadata || {}),
      ...(metadata || {}),
    };
    if (branchId !== undefined) mergedMetadata.branch_id = branchId;
    if (departmentId !== undefined) mergedMetadata.department_id = departmentId;
    updatePayload.metadata = mergedMetadata;

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await AuditEngine.log({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: req.params.id,
      oldValue: { name: existing.name, phone: existing.phone, isActive: existing.is_active },
      newValue: { name: updated.name, phone: updated.phone, isActive: updated.is_active },
    });

    return response.success(res, updated, 'User updated successfully');
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 5. PATCH /api/admin/users/:id/role — Change user primary role
// ─────────────────────────────────────────────────────────────
router.patch('/:id/role', validate(changeRoleSchema), async (req, res, next) => {
  try {
    const { roleId, roleName, branchId } = req.body;

    // Find target user
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!targetUser) return response.notFound(res, 'User not found');

    // Resolve new role
    let newRole = null;
    if (roleId) {
      const { data: r } = await supabaseAdmin.from('roles').select('id, name').eq('id', roleId).maybeSingle();
      newRole = r;
    } else if (roleName) {
      const { data: r } = await supabaseAdmin.from('roles').select('id, name').ilike('name', roleName).maybeSingle();
      newRole = r;
    }

    if (!newRole) return response.notFound(res, 'Role not found');

    // LAST ADMIN PROTECTION:
    // If target user is Super Admin and is being demoted to non-Super Admin, check active Super Admin count
    const isTargetAdmin = await isUserSuperAdmin(req.params.id);
    if (isTargetAdmin && newRole.name !== 'Super Admin') {
      const count = await countActiveSuperAdmins();
      if (count <= 1 || (req.user && req.user.id === req.params.id)) {
        return response.badRequest(res, 'You cannot remove or demote the last active Super Admin. Create another Super Admin before modifying this account.');
      }
    }

    // Fetch existing role(s) for audit logging
    const { data: oldRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', req.params.id);
    const oldRoleNames = (oldRoles || []).map(r => r.roles?.name || r.role_id);

    // Remove existing roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', req.params.id);

    // Assign new role
    const { error: assignErr } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: req.params.id,
        role_id: newRole.id,
        branch_id: branchId || null,
      });

    if (assignErr) throw assignErr;

    // Update metadata user_type
    const newUserType = newRole.name.toLowerCase() === 'student' ? 'Student' : 'Management';
    await supabaseAdmin
      .from('users')
      .update({
        metadata: {
          ...(targetUser.metadata || {}),
          user_type: newUserType,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id);

    // Calculate updated access
    const updatedAccess = AccessControl.getUserFullAccess({
      ...targetUser,
      roles: [newRole],
    });

    // Audit log
    await AuditEngine.log({
      userId: req.user.id,
      action: 'ROLE_CHANGED',
      entityType: 'user',
      entityId: req.params.id,
      oldValue: { roles: oldRoleNames },
      newValue: { role: newRole.name, userType: newUserType, portals: updatedAccess.portals },
    });

    return response.success(res, {
      userId: req.params.id,
      role: newRole,
      roles: [newRole],
      userType: newUserType,
      access: updatedAccess,
      portals: updatedAccess.portals,
      defaultPortal: updatedAccess.defaultPortal,
      redirectPath: updatedAccess.redirectPath,
    }, `User role changed to ${newRole.name}`);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 6. POST /api/admin/users/:id/reset-password — Reset user password
// ─────────────────────────────────────────────────────────────
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const { temporaryPassword, newPassword, password } = req.body || {};

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !user) return response.notFound(res, 'User not found');

    // Use supplied password or generate secure temporary password
    const tempPassword = temporaryPassword || newPassword || password || `CampusFlow@${Math.floor(100000 + Math.random() * 900000)}`;

    let authId = user.auth_id;
    if (authId) {
      await supabaseAdmin.auth.admin.updateUserById(authId, { password: tempPassword });
    } else {
      // Find or create user in Supabase Auth
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const found = list?.users?.find(u => u.email === user.email);
      if (found) {
        authId = found.id;
        await supabaseAdmin.auth.admin.updateUserById(authId, { password: tempPassword });
      } else {
        const { data: created } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: user.name },
        });
        authId = created?.user?.id;
      }
      if (authId) {
        await supabaseAdmin.from('users').update({ auth_id: authId }).eq('id', user.id);
      }
    }

    // Audit log (NEVER store password in audit log)
    await AuditEngine.log({
      userId: req.user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'user',
      entityId: user.id,
      oldValue: null,
      newValue: { targetEmail: user.email, resetAt: new Date().toISOString() },
    });

    return response.success(res, {
      userId: user.id,
      email: user.email,
      reset: true,
    }, 'Password reset successfully');
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 7. PATCH /api/admin/users/:id/status — Toggle active status
// ─────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return response.badRequest(res, 'isActive boolean is required');
    }

    // LAST ADMIN PROTECTION:
    // If deactivating user, check if user is a Super Admin and if they are the last active Super Admin
    if (isActive === false) {
      const isTargetAdmin = await isUserSuperAdmin(req.params.id);
      if (isTargetAdmin) {
        const count = await countActiveSuperAdmins();
        if (count <= 1 || (req.user && req.user.id === req.params.id)) {
          return response.badRequest(res, 'You cannot remove or deactivate the last active Super Admin. Create another Super Admin before modifying this account.');
        }
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await AuditEngine.log({
      userId: req.user.id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      newValue: { isActive },
    });

    return response.success(res, updated, `User account ${isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 8. POST /api/admin/users/:id/roles — Assign role to user
// ─────────────────────────────────────────────────────────────
router.post('/:id/roles', async (req, res, next) => {
  try {
    const { roleId, branchId } = req.body;
    if (!roleId) return response.badRequest(res, 'roleId is required');

    const { data: roleRow } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .maybeSingle();

    if (!roleRow) return response.notFound(res, 'Role not found');

    const { data: existing } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', req.params.id)
      .eq('role_id', roleId)
      .maybeSingle();

    if (existing) {
      return response.success(res, existing, 'Role is already assigned to this user');
    }

    const { data: created, error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: req.params.id,
        role_id: roleId,
        branch_id: branchId || null,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditEngine.log({
      userId: req.user.id,
      action: 'ROLE_ASSIGNED',
      entityType: 'user',
      entityId: req.params.id,
      newValue: { roleId, roleName: roleRow.name },
    });

    return response.created(res, created, `Role ${roleRow.name} assigned to user`);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 9. DELETE /api/admin/users/:id/roles/:roleId — Remove role
// ─────────────────────────────────────────────────────────────
router.delete('/:id/roles/:roleId', async (req, res, next) => {
  try {
    // Check if removing Super Admin role from last Super Admin
    const { data: roleRow } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', req.params.roleId)
      .maybeSingle();

    if (roleRow?.name === 'Super Admin') {
      const count = await countActiveSuperAdmins();
      if (count <= 1) {
        return response.badRequest(res, 'You cannot remove the last active Super Admin. Create another Super Admin before modifying this account.');
      }
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', req.params.id)
      .eq('role_id', req.params.roleId);

    if (error) throw error;

    await AuditEngine.log({
      userId: req.user.id,
      action: 'ROLE_REMOVED',
      entityType: 'user',
      entityId: req.params.id,
      oldValue: { roleId: req.params.roleId },
    });

    return response.success(res, null, 'Role removed from user');
  } catch (err) { next(err); }
});

export default router;
