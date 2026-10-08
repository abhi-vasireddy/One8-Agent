import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { pipelineStages, stageTransitions } from '../../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const stageSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  color: z.string().optional().default('#6366f1'),
  icon: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
  settings: z.record(z.any()).optional().default({}),
  entryActions: z.array(z.any()).optional().default([]),
  exitActions: z.array(z.any()).optional().default([]),
  requiredFieldIds: z.array(z.string()).optional().default([]),
  slaHours: z.number().int().optional().nullable(),
  approvalRequired: z.boolean().optional().default(false),
  autoAssignmentConfig: z.record(z.any()).optional().default({}),
  isInitial: z.boolean().optional().default(false),
  isFinal: z.boolean().optional().default(false),
});

const formatStage = (s) => ({
  id: s.id,
  pipelineId: s.pipeline_id || s.pipelineId,
  name: s.name,
  description: s.description,
  color: s.color,
  icon: s.icon,
  order: s.order,
  settings: s.settings || {},
  entryActions: s.entry_actions || s.entryActions || [],
  exitActions: s.exit_actions || s.exitActions || [],
  requiredFieldIds: s.required_field_ids || s.requiredFieldIds || [],
  slaHours: s.sla_hours !== undefined ? s.sla_hours : s.slaHours,
  approvalRequired: s.approval_required !== undefined ? s.approval_required : s.approvalRequired,
  autoAssignmentConfig: s.auto_assignment_config || s.autoAssignmentConfig || {},
  isInitial: s.is_initial !== undefined ? s.is_initial : s.isInitial,
  isFinal: s.is_final !== undefined ? s.is_final : s.isFinal,
  createdAt: s.created_at || s.createdAt,
  updatedAt: s.updated_at || s.updatedAt,
});

// GET /api/config/pipelines/:pipelineId/stages
router.get('/pipelines/:pipelineId/stages', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', req.params.pipelineId)
      .order('order', { ascending: true });

    if (error || !data) {
      const stages = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineId, req.params.pipelineId))
        .orderBy(asc(pipelineStages.order));
      return response.success(res, stages.map(formatStage));
    }

    return response.success(res, data.map(formatStage));
  } catch (err) { next(err); }
});

// POST /api/config/pipelines/:pipelineId/stages
router.post('/pipelines/:pipelineId/stages', authenticate, requireRole('Super Admin', 'Admin'), validate(stageSchema), auditMiddleware('pipeline_stage'), async (req, res, next) => {
  try {
    const insertPayload = {
      name: req.body.name,
      description: req.body.description || null,
      color: req.body.color || '#6366f1',
      icon: req.body.icon || null,
      order: req.body.order || 0,
      settings: req.body.settings || {},
      entry_actions: req.body.entryActions || [],
      exit_actions: req.body.exitActions || [],
      required_field_ids: req.body.requiredFieldIds || [],
      sla_hours: req.body.slaHours ?? null,
      approval_required: req.body.approvalRequired || false,
      auto_assignment_config: req.body.autoAssignmentConfig || {},
      is_initial: req.body.isInitial || false,
      is_final: req.body.isFinal || false,
      pipeline_id: req.params.pipelineId,
    };

    const { data: stage, error } = await supabaseAdmin
      .from('pipeline_stages')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase stage insert error:', error);
      throw error;
    }

    return response.created(res, formatStage(stage), 'Stage created');
  } catch (err) { next(err); }
});

// PUT /api/config/stages/:id
router.put('/:id', authenticate, requireRole('Super Admin', 'Admin'), validate(stageSchema.partial()), auditMiddleware('pipeline_stage'), async (req, res, next) => {
  try {
    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.color !== undefined) updatePayload.color = req.body.color;
    if (req.body.icon !== undefined) updatePayload.icon = req.body.icon;
    if (req.body.order !== undefined) updatePayload.order = req.body.order;
    if (req.body.settings !== undefined) updatePayload.settings = req.body.settings;
    if (req.body.entryActions !== undefined) updatePayload.entry_actions = req.body.entryActions;
    if (req.body.exitActions !== undefined) updatePayload.exit_actions = req.body.exitActions;
    if (req.body.requiredFieldIds !== undefined) updatePayload.required_field_ids = req.body.requiredFieldIds;
    if (req.body.slaHours !== undefined) updatePayload.sla_hours = req.body.slaHours;
    if (req.body.approvalRequired !== undefined) updatePayload.approval_required = req.body.approvalRequired;
    if (req.body.autoAssignmentConfig !== undefined) updatePayload.auto_assignment_config = req.body.autoAssignmentConfig;
    if (req.body.isInitial !== undefined) updatePayload.is_initial = req.body.isInitial;
    if (req.body.isFinal !== undefined) updatePayload.is_final = req.body.isFinal;
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('pipeline_stages')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !updated) return response.notFound(res, 'Stage not found');

    return response.success(res, formatStage(updated), 'Stage updated');
  } catch (err) { next(err); }
});

// PUT /api/config/pipelines/:pipelineId/stages/reorder
router.put('/pipelines/:pipelineId/stages/reorder', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { stageOrders } = req.body; // array of { id, order }
    if (!Array.isArray(stageOrders)) return response.badRequest(res, 'stageOrders must be an array');

    for (const item of stageOrders) {
      await supabaseAdmin
        .from('pipeline_stages')
        .update({ order: item.order, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }

    return response.success(res, null, 'Stages reordered');
  } catch (err) { next(err); }
});

// DELETE /api/config/stages/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('pipeline_stage'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('pipeline_stages')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(pipelineStages).where(eq(pipelineStages.id, req.params.id));
    }
    return response.success(res, null, 'Stage deleted');
  } catch (err) { next(err); }
});

// Transitions routes
// GET /api/config/pipelines/:pipelineId/transitions
router.get('/pipelines/:pipelineId/transitions', authenticate, async (req, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from('stage_transitions')
      .select('*')
      .eq('pipeline_id', req.params.pipelineId);

    const transitions = (data || []).map(t => ({
      id: t.id,
      pipelineId: t.pipeline_id,
      fromStageId: t.from_stage_id,
      toStageId: t.to_stage_id,
      allowedRoleIds: t.allowed_role_ids || [],
      conditions: t.conditions || {},
      createdAt: t.created_at,
    }));

    return response.success(res, transitions);
  } catch (err) { next(err); }
});

// POST /api/config/pipelines/:pipelineId/transitions
router.post('/pipelines/:pipelineId/transitions', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { fromStageId, toStageId, allowedRoleIds = [], conditions = {} } = req.body;
    const { data, error } = await supabaseAdmin
      .from('stage_transitions')
      .insert({
        pipeline_id: req.params.pipelineId,
        from_stage_id: fromStageId,
        to_stage_id: toStageId,
        allowed_role_ids: allowedRoleIds,
        conditions,
      })
      .select()
      .single();

    if (error) throw error;

    return response.created(res, {
      id: data.id,
      pipelineId: data.pipeline_id,
      fromStageId: data.from_stage_id,
      toStageId: data.to_stage_id,
      allowedRoleIds: data.allowed_role_ids,
      conditions: data.conditions,
      createdAt: data.created_at,
    }, 'Transition defined');
  } catch (err) { next(err); }
});

export default router;
