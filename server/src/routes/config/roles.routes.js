import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { roles, userRoles, users, permissions } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const roleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  settings: z.record(z.any()).optional().default({}),
});

// GET /api/config/roles — List roles for the college
router.get('/', authenticate, async (req, res, next) => {
  try {
    let allRoles = [];
    try {
      allRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.collegeId, req.user.collegeId));
    } catch (dbErr) {
      const { data } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('college_id', req.user.collegeId);
      allRoles = (data || []).map(r => ({
        id: r.id,
        collegeId: r.college_id,
        name: r.name,
        description: r.description,
        isSystem: r.is_system,
        settings: r.settings || {},
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }

    return response.success(res, allRoles);
  } catch (err) { next(err); }
});

// POST /api/config/roles — Create new custom role
router.post('/', authenticate, requireRole('Super Admin'), validate(roleSchema), auditMiddleware('role'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const insertPayload = {
      name: req.body.name,
      description: req.body.description || null,
      settings: req.body.settings || {},
      college_id: collegeId,
      is_system: false,
    };

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase role insert error:', error);
      throw error;
    }

    return response.created(res, {
      id: role.id,
      collegeId: role.college_id,
      name: role.name,
      description: role.description,
      isSystem: role.is_system,
      settings: role.settings || {},
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    }, 'Role created');
  } catch (err) { next(err); }
});

// PUT /api/config/roles/:id
router.put('/:id', authenticate, requireRole('Super Admin'), validate(roleSchema.partial()), auditMiddleware('role'), async (req, res, next) => {
  try {
    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.settings !== undefined) updatePayload.settings = req.body.settings;
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('roles')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !updated) return response.notFound(res, 'Role not found');

    return response.success(res, {
      id: updated.id,
      collegeId: updated.college_id,
      name: updated.name,
      description: updated.description,
      isSystem: updated.is_system,
      settings: updated.settings || {},
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }, 'Role updated');
  } catch (err) { next(err); }
});

// DELETE /api/config/roles/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('role'), async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!existing) return response.notFound(res, 'Role not found');
    if (existing.is_system) return response.badRequest(res, 'System roles cannot be deleted');

    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(roles).where(eq(roles.id, req.params.id));
    }

    return response.success(res, null, 'Role deleted');
  } catch (err) { next(err); }
});

// User-Role Assignments:
// POST /api/config/roles/assign-user
router.post('/assign-user', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { userId, roleId, branchId = null, pipelineId = null } = req.body;

    const { data: assignment, error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        branch_id: branchId,
        pipeline_id: pipelineId,
      })
      .select()
      .single();

    if (error) throw error;

    return response.created(res, assignment, 'Role assigned to user');
  } catch (err) { next(err); }
});

// DELETE /api/config/roles/remove-user/:userRoleId
router.delete('/remove-user/:userRoleId', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', req.params.userRoleId);

    if (error) {
      await db.delete(userRoles).where(eq(userRoles.id, req.params.userRoleId));
    }
    return response.success(res, null, 'User role assignment removed');
  } catch (err) { next(err); }
});

export default router;
