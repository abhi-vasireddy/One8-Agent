import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { branches } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

// Validation schemas
const createBranchSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  campusId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  settings: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

const updateBranchSchema = createBranchSchema.partial();

// GET /api/config/branches
router.get('/', authenticate, async (req, res, next) => {
  try {
    let result = [];
    try {
      result = await db
        .select()
        .from(branches)
        .where(eq(branches.collegeId, req.user.collegeId))
        .orderBy(branches.name);
    } catch (dbErr) {
      const { data } = await supabaseAdmin
        .from('branches')
        .select('*')
        .eq('college_id', req.user.collegeId)
        .order('name');
      result = (data || []).map(b => ({
        id: b.id,
        collegeId: b.college_id,
        campusId: b.campus_id,
        name: b.name,
        code: b.code,
        description: b.description,
        settings: b.settings || {},
        isActive: b.is_active,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }));
    }

    return response.success(res, result);
  } catch (err) { next(err); }
});

// GET /api/config/branches/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { data: branch, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !branch) return response.notFound(res, 'Branch not found');
    return response.success(res, {
      id: branch.id,
      collegeId: branch.college_id,
      campusId: branch.campus_id,
      name: branch.name,
      code: branch.code,
      description: branch.description,
      settings: branch.settings || {},
      isActive: branch.is_active,
      createdAt: branch.created_at,
      updatedAt: branch.updated_at,
    });
  } catch (err) { next(err); }
});

// POST /api/config/branches
router.post('/', authenticate, requireRole('Super Admin', 'Admin'), validate(createBranchSchema), auditMiddleware('branch'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const insertPayload = {
      name: req.body.name,
      code: req.body.code,
      campus_id: req.body.campusId || null,
      description: req.body.description || null,
      settings: req.body.settings || {},
      is_active: req.body.isActive !== false,
      college_id: collegeId,
    };

    const { data: branch, error } = await supabaseAdmin
      .from('branches')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase branch insert error:', error);
      throw error;
    }

    return response.created(res, {
      id: branch.id,
      collegeId: branch.college_id,
      campusId: branch.campus_id,
      name: branch.name,
      code: branch.code,
      description: branch.description,
      settings: branch.settings || {},
      isActive: branch.is_active,
      createdAt: branch.created_at,
      updatedAt: branch.updated_at,
    });
  } catch (err) { next(err); }
});

// PUT /api/config/branches/:id
router.put('/:id', authenticate, requireRole('Super Admin', 'Admin'), validate(updateBranchSchema), auditMiddleware('branch'), async (req, res, next) => {
  try {
    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.code !== undefined) updatePayload.code = req.body.code;
    if (req.body.campusId !== undefined) updatePayload.campus_id = req.body.campusId;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.settings !== undefined) updatePayload.settings = req.body.settings;
    if (req.body.isActive !== undefined) updatePayload.is_active = req.body.isActive;
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('branches')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !updated) return response.notFound(res, 'Branch not found');
    return response.success(res, {
      id: updated.id,
      collegeId: updated.college_id,
      campusId: updated.campus_id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      settings: updated.settings || {},
      isActive: updated.is_active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }, 'Branch updated');
  } catch (err) { next(err); }
});

// DELETE /api/config/branches/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('branch'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('branches')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(branches).where(eq(branches.id, req.params.id));
    }
    return response.success(res, null, 'Branch deleted');
  } catch (err) { next(err); }
});

export default router;
