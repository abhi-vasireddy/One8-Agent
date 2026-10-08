import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { permissions, roles } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

// GET /api/config/permissions/roles/:roleId — Get permissions for role
router.get('/roles/:roleId', authenticate, async (req, res, next) => {
  try {
    const { data: list } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('role_id', req.params.roleId);

    const formatted = (list || []).map(p => ({
      id: p.id,
      roleId: p.role_id,
      resourceType: p.resource_type,
      resourceId: p.resource_id,
      actions: p.actions || {},
      fieldPermissions: p.field_permissions || {},
      conditions: p.conditions || {},
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return response.success(res, formatted);
  } catch (err) { next(err); }
});

// POST /api/config/permissions — Add or upsert permission rule for a role
router.post('/', authenticate, requireRole('Super Admin'), auditMiddleware('permission'), async (req, res, next) => {
  try {
    const { roleId, resourceType, resourceId = null, actions = {}, fieldPermissions = {}, conditions = {} } = req.body;

    let query = supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('role_id', roleId)
      .eq('resource_type', resourceType);

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      req._auditOldValue = existing;
      const { data: updated, error } = await supabaseAdmin
        .from('permissions')
        .update({
          actions,
          field_permissions: fieldPermissions,
          conditions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return response.success(res, updated, 'Permission updated');
    }

    const { data: created, error } = await supabaseAdmin
      .from('permissions')
      .insert({
        role_id: roleId,
        resource_type: resourceType,
        resource_id: resourceId,
        actions,
        field_permissions: fieldPermissions,
        conditions,
      })
      .select()
      .single();

    if (error) throw error;
    return response.created(res, created, 'Permission granted');
  } catch (err) { next(err); }
});

// DELETE /api/config/permissions/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('permission'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(permissions).where(eq(permissions.id, req.params.id));
    }
    return response.success(res, null, 'Permission deleted');
  } catch (err) { next(err); }
});

export default router;
