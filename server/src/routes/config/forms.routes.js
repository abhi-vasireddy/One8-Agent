import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { forms } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import { FormEngine } from '../../engines/form-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const formSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  pipelineId: z.string().uuid().optional().nullable(),
  stageId: z.string().uuid().optional().nullable(),
  fieldIds: z.array(z.string()).optional().default([]),
  layout: z.record(z.any()).optional().default({}),
  settings: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

const formatForm = (f) => ({
  id: f.id,
  collegeId: f.college_id || f.collegeId,
  pipelineId: f.pipeline_id || f.pipelineId,
  stageId: f.stage_id || f.stageId,
  name: f.name,
  description: f.description,
  fieldIds: f.field_ids || f.fieldIds || [],
  layout: f.layout || {},
  settings: f.settings || {},
  isActive: f.is_active !== undefined ? f.is_active : f.isActive,
  createdAt: f.created_at || f.createdAt,
  updatedAt: f.updated_at || f.updatedAt,
});

// GET /api/config/forms
router.get('/', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: list, error } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('college_id', collegeId);

    if (error || !list) {
      const dbList = await db
        .select()
        .from(forms)
        .where(eq(forms.collegeId, collegeId));
      return response.success(res, dbList.map(formatForm));
    }

    return response.success(res, list.map(formatForm));
  } catch (err) { next(err); }
});

// GET /api/config/forms/:id — Form metadata + populated fields
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await FormEngine.getFormDefinition({ formId: req.params.id });
    return response.success(res, result);
  } catch (err) { next(err); }
});

// POST /api/config/forms
router.post('/', authenticate, requireRole('Super Admin', 'Admin'), validate(formSchema), auditMiddleware('form'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const insertPayload = {
      name: req.body.name,
      description: req.body.description || null,
      pipeline_id: req.body.pipelineId || null,
      stage_id: req.body.stageId || null,
      field_ids: req.body.fieldIds || [],
      layout: req.body.layout || {},
      settings: req.body.settings || {},
      is_active: req.body.isActive !== false,
      college_id: collegeId,
    };

    const { data: created, error } = await supabaseAdmin
      .from('forms')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase form insert error:', error);
      throw error;
    }

    return response.created(res, formatForm(created), 'Form created');
  } catch (err) { next(err); }
});

// PUT /api/config/forms/:id
router.put('/:id', authenticate, requireRole('Super Admin', 'Admin'), validate(formSchema.partial()), auditMiddleware('form'), async (req, res, next) => {
  try {
    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.pipelineId !== undefined) updatePayload.pipeline_id = req.body.pipelineId;
    if (req.body.stageId !== undefined) updatePayload.stage_id = req.body.stageId;
    if (req.body.fieldIds !== undefined) updatePayload.field_ids = req.body.fieldIds;
    if (req.body.layout !== undefined) updatePayload.layout = req.body.layout;
    if (req.body.settings !== undefined) updatePayload.settings = req.body.settings;
    if (req.body.isActive !== undefined) updatePayload.is_active = req.body.isActive;
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('forms')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !updated) return response.notFound(res, 'Form not found');

    return response.success(res, formatForm(updated), 'Form updated');
  } catch (err) { next(err); }
});

// DELETE /api/config/forms/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('form'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('forms')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(forms).where(eq(forms.id, req.params.id));
    }

    return response.success(res, null, 'Form deleted');
  } catch (err) { next(err); }
});

export default router;
