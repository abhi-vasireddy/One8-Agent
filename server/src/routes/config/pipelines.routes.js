import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { pipelines, pipelineStages, pipelineFields, customFields } from '../../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import { PermissionEngine } from '../../engines/permission-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const formatPipeline = (p) => ({
  id: p.id,
  collegeId: p.college_id || p.collegeId,
  branchId: p.branch_id || p.branchId,
  departmentId: p.department_id || p.departmentId,
  name: p.name,
  description: p.description,
  entityType: p.entity_type || p.entityType,
  icon: p.icon,
  color: p.color,
  settings: p.settings || {},
  slaConfig: p.sla_config || p.slaConfig || {},
  notificationConfig: p.notification_config || p.notificationConfig || {},
  isActive: p.is_active !== undefined ? p.is_active : p.isActive,
  isArchived: p.is_archived !== undefined ? p.is_archived : p.isArchived,
  createdAt: p.created_at || p.createdAt,
  updatedAt: p.updated_at || p.updatedAt,
});

// Validation schemas
const createPipelineSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  entityType: z.string().max(100).optional().default('request'),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  settings: z.record(z.any()).optional().default({}),
  slaConfig: z.record(z.any()).optional().default({}),
  notificationConfig: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

const updatePipelineSchema = createPipelineSchema.partial();

// GET /api/config/pipelines — List all pipelines (filtered by user access)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pipelines')
      .select('*')
      .eq('college_id', req.user.collegeId)
      .order('name');

    let allPipelines = [];
    if (!error && data) {
      allPipelines = data.map(formatPipeline);
    } else {
      const dbPipelines = await db
        .select()
        .from(pipelines)
        .where(
          and(
            eq(pipelines.collegeId, req.user.collegeId),
            eq(pipelines.isArchived, false)
          )
        )
        .orderBy(pipelines.name);
      allPipelines = dbPipelines.map(formatPipeline);
    }

    // Filter by user's pipeline access permissions
    if (req.user?.isSuperAdmin || !req.user) {
      return response.success(res, allPipelines);
    }

    const accessible = [];
    for (const pipeline of allPipelines) {
      try {
        const canAccess = await PermissionEngine.canAccessPipeline(req.user, pipeline.id);
        if (canAccess) accessible.push(pipeline);
      } catch (permErr) {
        // Fallback: allow access if check fails in dev/demo
        accessible.push(pipeline);
      }
    }

    return response.success(res, accessible);
  } catch (err) { next(err); }
});

// GET /api/config/pipelines/:id — Pipeline with stages and fields
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { data: pipeline, error: pErr } = await supabaseAdmin
      .from('pipelines')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!pipeline) return response.notFound(res, 'Pipeline not found');

    // Load stages
    const { data: stages } = await supabaseAdmin
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipeline.id)
      .order('order', { ascending: true });

    // Load pipeline fields with custom field details
    const { data: pFields } = await supabaseAdmin
      .from('pipeline_fields')
      .select('*, field:custom_fields(*)')
      .eq('pipeline_id', pipeline.id)
      .order('order', { ascending: true });

    const formattedFields = (pFields || []).map(pf => ({
      ...(pf.field || {}),
      pipelineFieldId: pf.id,
      order: pf.order,
      isRequired: pf.is_required,
      stageId: pf.stage_id,
    }));

    return response.success(res, {
      ...formatPipeline(pipeline),
      stages: (stages || []).map(s => ({
        id: s.id,
        pipelineId: s.pipeline_id,
        name: s.name,
        description: s.description,
        color: s.color,
        icon: s.icon,
        order: s.order,
        settings: s.settings || {},
        entryActions: s.entry_actions || [],
        exitActions: s.exit_actions || [],
        requiredFieldIds: s.required_field_ids || [],
        slaHours: s.sla_hours,
        approvalRequired: s.approval_required,
        autoAssignmentConfig: s.auto_assignment_config || {},
        isInitial: s.is_initial,
        isFinal: s.is_final,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
      fields: formattedFields,
    });
  } catch (err) { next(err); }
});

// POST /api/config/pipelines
router.post('/', authenticate, requireRole('Super Admin', 'Admin'), validate(createPipelineSchema), auditMiddleware('pipeline'), async (req, res, next) => {
  try {
    let validUserId = null;
    if (req.user?.id) {
      const { data: u } = await supabaseAdmin.from('users').select('id').eq('id', req.user.id).maybeSingle();
      if (u?.id) validUserId = u.id;
    }

    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';

    const insertPayload = {
      name: req.body.name,
      description: req.body.description || null,
      branch_id: req.body.branchId || null,
      department_id: req.body.departmentId || null,
      entity_type: req.body.entityType || 'request',
      icon: req.body.icon || null,
      color: req.body.color || '#6366f1',
      settings: req.body.settings || {},
      sla_config: req.body.slaConfig || {},
      notification_config: req.body.notificationConfig || {},
      is_active: req.body.isActive !== false,
      is_archived: false,
      college_id: collegeId,
      created_by: validUserId,
    };

    const { data: pipeline, error } = await supabaseAdmin
      .from('pipelines')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase pipeline insert error:', error);
      throw error;
    }

    // Automatically seed standard initial stages for Kanban board functionality
    const defaultStages = [
      { name: 'Application Received', color: '#6366f1', order: 0, is_initial: true, is_final: false },
      { name: 'Under Review', color: '#f59e0b', order: 1, is_initial: false, is_final: false },
      { name: 'Approved', color: '#10b981', order: 2, is_initial: false, is_final: true },
      { name: 'Rejected', color: '#ef4444', order: 3, is_initial: false, is_final: true },
    ].map(s => ({ ...s, pipeline_id: pipeline.id }));

    await supabaseAdmin.from('pipeline_stages').insert(defaultStages);

    return response.created(res, formatPipeline(pipeline), 'Pipeline created successfully');
  } catch (err) { next(err); }
});

// PUT /api/config/pipelines/:id
router.put('/:id', authenticate, requireRole('Super Admin', 'Admin'), validate(updatePipelineSchema), auditMiddleware('pipeline'), async (req, res, next) => {
  try {
    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.branchId !== undefined) updatePayload.branch_id = req.body.branchId;
    if (req.body.departmentId !== undefined) updatePayload.department_id = req.body.departmentId;
    if (req.body.entityType !== undefined) updatePayload.entity_type = req.body.entityType;
    if (req.body.icon !== undefined) updatePayload.icon = req.body.icon;
    if (req.body.color !== undefined) updatePayload.color = req.body.color;
    if (req.body.settings !== undefined) updatePayload.settings = req.body.settings;
    if (req.body.slaConfig !== undefined) updatePayload.sla_config = req.body.slaConfig;
    if (req.body.notificationConfig !== undefined) updatePayload.notification_config = req.body.notificationConfig;
    if (req.body.isActive !== undefined) updatePayload.is_active = req.body.isActive;
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('pipelines')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !data) return response.notFound(res, 'Pipeline not found');
    return response.success(res, formatPipeline(data), 'Pipeline updated');
  } catch (err) { next(err); }
});

// DELETE /api/config/pipelines/:id (archive)
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('pipeline'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pipelines')
      .update({ is_archived: true, is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !data) return response.notFound(res, 'Pipeline not found');
    return response.success(res, formatPipeline(data), 'Pipeline archived');
  } catch (err) { next(err); }
});

// POST /api/config/pipelines/:id/duplicate
router.post('/:id/duplicate', authenticate, requireRole('Super Admin', 'Admin'), auditMiddleware('pipeline'), async (req, res, next) => {
  try {
    const { data: original } = await supabaseAdmin
      .from('pipelines')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!original) return response.notFound(res, 'Pipeline not found');

    const { id: origId, created_at, updated_at, ...dupData } = original;
    const { data: newPipeline, error } = await supabaseAdmin
      .from('pipelines')
      .insert({
        ...dupData,
        name: `${original.name} (Copy)`,
        created_by: null,
      })
      .select()
      .single();

    if (error) throw error;

    // Duplicate stages
    const { data: origStages } = await supabaseAdmin
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', original.id);

    if (origStages && origStages.length > 0) {
      const copyStages = origStages.map(s => {
        const { id: sId, created_at: sca, updated_at: sua, ...stData } = s;
        return { ...stData, pipeline_id: newPipeline.id };
      });
      await supabaseAdmin.from('pipeline_stages').insert(copyStages);
    }

    return response.created(res, formatPipeline(newPipeline), 'Pipeline duplicated');
  } catch (err) { next(err); }
});

export default router;
