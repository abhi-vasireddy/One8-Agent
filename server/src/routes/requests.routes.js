import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/database.js';
import { supabaseAdmin } from '../config/supabase.js';
import { requests, requestStatusHistory, pipelineStages, pipelines, users, customFields, pipelineFields } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PipelineEngine } from '../engines/pipeline-engine.js';
import { FieldEngine } from '../engines/field-engine.js';
import { NotificationEngine } from '../engines/notification-engine.js';
import { AuditEngine } from '../engines/audit-engine.js';
import { WorkflowEngine } from '../engines/workflow-engine.js';
import { PermissionEngine } from '../engines/permission-engine.js';
import * as response from '../utils/api-response.js';

const router = Router();

const createRequestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  pipelineId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  customFieldValues: z.record(z.any()).optional().default({}),
});

const transitionSchema = z.object({
  targetStageId: z.string().uuid(),
  reason: z.string().optional().default(''),
});

// Helper: Ensure valid user id exists
async function getValidUserId(reqUser) {
  if (!reqUser?.id) return null;
  const { data: u } = await supabaseAdmin.from('users').select('id').eq('id', reqUser.id).maybeSingle();
  if (u?.id) return u.id;
  const { data: upserted } = await supabaseAdmin.from('users').upsert({
    id: reqUser.id,
    email: reqUser.email || 'user@campusflow.local',
    name: reqUser.name || 'User',
    college_id: reqUser.collegeId || '11111111-1111-1111-1111-111111111111',
    is_active: true,
  }).select().single();
  return upserted?.id || reqUser.id;
}

// ─────────────────────────────────────────────────────────────
// GET /api/requests — List requests with optional filters
// ─────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { pipelineId, stageId, branchId, priority } = req.query;

    const { data, error } = await supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*), assignedUser:users!requests_assigned_user_id_fkey(id, name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let rows = (data || []).map(r => ({
      request: {
        id: r.id,
        requestNumber: r.request_number,
        title: r.title,
        description: r.description,
        pipelineId: r.pipeline_id,
        stageId: r.stage_id,
        branchId: r.branch_id,
        priority: r.priority,
        customFieldValues: r.custom_field_values || {},
        workflowState: r.workflow_state || {},
        assignedUserId: r.assigned_user_id,
        assignedRoleId: r.assigned_role_id,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
      stage: r.stage,
      pipeline: r.pipeline,
      assignedUser: r.assignedUser,
    }));

    // Filter in-memory or by query
    let filtered = rows.filter(r => {
      if (pipelineId && r.request.pipelineId !== pipelineId) return false;
      if (stageId && r.request.stageId !== stageId) return false;
      if (branchId && r.request.branchId !== branchId) return false;
      if (priority && r.request.priority !== priority) return false;
      return true;
    });

    // Check student own-records permission
    if (req.user.roles?.some(role => (role.name || role.roleName) === 'Student')) {
      filtered = filtered.filter(r => r.request.createdBy === req.user.id);
    }

    const formatted = filtered.map(r => ({
      ...r.request,
      stageName: r.stage?.name,
      stageColor: r.stage?.color,
      pipelineName: r.pipeline?.name,
      assignedUserName: r.assignedUser?.name,
    }));

    return response.success(res, formatted);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/requests/:id — Full request details
// ─────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*), assignedUser:users!requests_assigned_user_id_fkey(id, name, email)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (reqErr) throw reqErr;
    if (!request) return response.notFound(res, 'Request not found');

    // Isolation check: Student role can only access their own requests
    const isStudentOnly = !req.user.isSuperAdmin && (req.user.roles || []).length > 0 && req.user.roles.every(r => (r.name || r.roleName || '').toLowerCase().includes('student'));
    if (isStudentOnly && request.created_by !== req.user.id) {
      return response.forbidden(res, 'Access denied: you can only access your own requests');
    }

    // History
    const { data: history } = await supabaseAdmin
      .from('request_status_history')
      .select('*, changedByUser:users(id, name)')
      .eq('request_id', req.params.id)
      .order('timestamp', { ascending: false });

    return response.success(res, {
      id: request.id,
      requestNumber: request.request_number,
      title: request.title,
      description: request.description,
      pipelineId: request.pipeline_id,
      stageId: request.stage_id,
      branchId: request.branch_id,
      priority: request.priority,
      customFieldValues: request.custom_field_values || {},
      workflowState: request.workflow_state || {},
      createdBy: request.created_by,
      assignedUserId: request.assigned_user_id,
      assignedRoleId: request.assigned_role_id,
      assignedUser: request.assignedUser,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      stage: request.stage,
      pipeline: request.pipeline,
      history: (history || []).map(h => ({
        id: h.id,
        requestId: h.request_id,
        fromStageId: h.from_stage_id,
        toStageId: h.to_stage_id,
        changedBy: h.changed_by,
        reason: h.reason,
        timestamp: h.timestamp,
        changedByName: h.changedByUser?.name || 'System Automation',
      })),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/requests — Create request with full lifecycle
// ─────────────────────────────────────────────────────────────
router.post('/', authenticate, validate(createRequestSchema), async (req, res, next) => {
  try {
    const { pipelineId, title, description, branchId, priority, customFieldValues } = req.body;

    // 1. Verify Pipeline Permission
    const canAccess = await PermissionEngine.canAccessPipeline(req.user, pipelineId, 'create');
    if (!canAccess) {
      return response.forbidden(res, 'You do not have permission to submit to this pipeline');
    }

    const validUserId = await getValidUserId(req.user);

    // 2. Load Pipeline Fields & Validate Required Fields Dynamically
    const { data: pFields } = await supabaseAdmin
      .from('pipeline_fields')
      .select('*, field:custom_fields(*)')
      .eq('pipeline_id', pipelineId);

    let requiredDefs = [];
    if (pFields && pFields.length > 0) {
      requiredDefs = pFields.map(pf => ({
        ...pf.field,
        isRequired: pf.is_required ?? pf.field?.is_required,
      })).filter(Boolean);
    } else {
      // Check global request custom fields
      const { data: globalFields } = await supabaseAdmin
        .from('custom_fields')
        .select('*')
        .eq('entity_type', 'request')
        .eq('is_required', true);
      requiredDefs = globalFields || [];
    }

    // Dynamic Validation via FieldEngine
    const validation = FieldEngine.validateFields(requiredDefs, customFieldValues || {});
    if (!validation.isValid) {
      return response.badRequest(res, Object.values(validation.errors).join(', '));
    }

    // 3. Determine Initial Stage dynamically from configuration (lowest order)
    const { data: initialStages } = await supabaseAdmin
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('order', { ascending: true })
      .limit(1);

    const initialStage = initialStages?.[0] || null;
    const stageId = initialStage?.id || null;
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}`;

    // 4. Create Request Record
    const insertPayload = {
      request_number: requestNumber,
      title,
      description: description || null,
      pipeline_id: pipelineId,
      stage_id: stageId,
      branch_id: branchId || null,
      priority: priority || 'medium',
      created_by: validUserId,
      custom_field_values: customFieldValues || {},
      workflow_state: { initialStageAssigned: Boolean(stageId) },
    };

    const { data: created, error } = await supabaseAdmin
      .from('requests')
      .insert(insertPayload)
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*)')
      .single();

    if (error) {
      console.error('[Requests] Insert error:', error);
      throw error;
    }

    // 5. Record initial status history
    if (stageId) {
      await supabaseAdmin.from('request_status_history').insert({
        request_id: created.id,
        to_stage_id: stageId,
        changed_by: validUserId,
        reason: `Initial submission in [${initialStage.name}]`,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Auto-Initialize Associated Thread in conversations & messages
    try {
      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .insert({
          request_id: created.id,
          user_id: validUserId,
          type: 'human',
        })
        .select()
        .single();

      if (conv?.id) {
        await supabaseAdmin.from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'system',
          sender_id: validUserId,
          content: `Thread initialized for application ${created.request_number} ("${created.title}"). Collaborative advisor notes and student correspondence are tracked here.`,
          metadata: { isInternal: false, authorName: 'System Engine' },
        });
      }
    } catch (convErr) {
      console.warn('[Requests] Thread initialization skipped:', convErr.message);
    }

    // 7. Record Audit Log
    await AuditEngine.log({
      userId: validUserId,
      action: 'REQUEST_CREATED',
      entityType: 'request',
      entityId: created.id,
      newValue: {
        requestNumber: created.request_number,
        title: created.title,
        pipelineId: created.pipeline_id,
        stageId: created.stage_id,
      },
    });

    // 8. Send In-App Notification to Submitter
    if (validUserId) {
      await NotificationEngine.send({
        userId: validUserId,
        type: 'request_created',
        title: `Submission Received: ${created.request_number}`,
        body: `Your request "${created.title}" has been submitted and is currently in [${initialStage?.name || 'Initiated'}].`,
        entityType: 'request',
        entityId: created.id,
      });
    }

    // 9. Trigger Configured Workflows for REQUEST_CREATED
    try {
      await WorkflowEngine.triggerEvent({
        eventType: 'REQUEST_CREATED',
        pipelineId: created.pipeline_id,
        stageId: created.stage_id,
        payload: {
          request: created,
          user: req.user,
          customFieldValues,
        },
      });
    } catch (wfErr) {
      console.warn('[Requests] Workflow trigger error:', wfErr.message);
    }

    return response.created(res, {
      id: created.id,
      requestNumber: created.request_number,
      title: created.title,
      description: created.description,
      pipelineId: created.pipeline_id,
      stageId: created.stage_id,
      stageName: created.stage?.name,
      pipelineName: created.pipeline?.name,
      priority: created.priority,
      customFieldValues: created.custom_field_values,
      createdBy: created.created_by,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    }, 'Request created successfully');
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/requests/:id/transition — Advance stage with lifecycle
// ─────────────────────────────────────────────────────────────
router.post('/:id/transition', authenticate, validate(transitionSchema), async (req, res, next) => {
  try {
    const { targetStageId, reason } = req.body;

    const updated = await PipelineEngine.transition({
      user: req.user,
      requestId: req.params.id,
      targetStageId,
      reason: reason || `Stage transition by ${req.user.name || 'Advisor'}`,
    });

    return response.success(res, updated, 'Request stage updated');
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/requests/:id — Update fields or assignment
// ─────────────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!existing) return response.notFound(res, 'Request not found');

    const { title, description, priority, assignedUserId, assignedRoleId, customFieldValues } = req.body;

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (priority !== undefined) updatePayload.priority = priority;
    if (assignedUserId !== undefined) updatePayload.assigned_user_id = assignedUserId;
    if (assignedRoleId !== undefined) updatePayload.assigned_role_id = assignedRoleId;
    if (customFieldValues !== undefined) {
      updatePayload.custom_field_values = {
        ...(existing.custom_field_values || {}),
        ...customFieldValues,
      };
    }
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('requests')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const validUserId = await getValidUserId(req.user);

    // If assignment changed, log audit and notify assignee
    if (assignedUserId && assignedUserId !== existing.assigned_user_id) {
      await AuditEngine.log({
        userId: validUserId,
        action: 'ASSIGNED',
        entityType: 'request',
        entityId: req.params.id,
        oldValue: { assignedUserId: existing.assigned_user_id },
        newValue: { assignedUserId },
      });

      await NotificationEngine.send({
        userId: assignedUserId,
        type: 'assigned',
        title: `New Assignment: ${existing.request_number}`,
        body: `You have been assigned to handle request "${existing.title}".`,
        entityType: 'request',
        entityId: req.params.id,
      });

      // Post notice to thread
      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('request_id', req.params.id)
        .maybeSingle();

      if (conv?.id) {
        await supabaseAdmin.from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'system',
          sender_id: validUserId,
          content: `Assignment updated: assigned to staff advisor.`,
          metadata: { isInternal: true, authorName: 'System Engine' },
        });
      }
    }

    // Trigger REQUEST_UPDATED workflow
    try {
      await WorkflowEngine.triggerEvent({
        eventType: 'REQUEST_UPDATED',
        pipelineId: updated.pipeline_id,
        stageId: updated.stage_id,
        payload: {
          request: updated,
          user: req.user,
        },
      });
    } catch (wfErr) {
      console.warn('[Requests] Workflow trigger on update skipped:', wfErr.message);
    }

    return response.success(res, updated, 'Request updated');
  } catch (err) { next(err); }
});

export default router;
