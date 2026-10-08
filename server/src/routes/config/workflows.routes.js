import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { workflows, workflowExecutions, workflowExecutionLogs } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import { WorkflowEngine } from '../../engines/workflow-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const workflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  pipelineId: z.string().uuid().optional().nullable(),
  triggerType: z.string().min(1).max(100),
  triggerConfig: z.record(z.any()).optional().default({}),
  nodes: z.array(z.any()).optional().default([]),
  edges: z.array(z.any()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const formatWorkflow = (w) => ({
  id: w.id,
  collegeId: w.college_id || w.collegeId,
  branchId: w.branch_id || w.branchId,
  pipelineId: w.pipeline_id || w.pipelineId,
  name: w.name,
  description: w.description,
  triggerType: w.trigger_type || w.triggerType,
  triggerConfig: w.trigger_config || w.triggerConfig || {},
  nodes: w.nodes || [],
  edges: w.edges || [],
  version: w.version || 1,
  isActive: w.is_active !== undefined ? w.is_active : w.isActive,
  createdAt: w.created_at || w.createdAt,
  updatedAt: w.updated_at || w.updatedAt,
});

// GET /api/config/workflows — List all workflows
router.get('/', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data, error } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('college_id', collegeId)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      const list = await db
        .select()
        .from(workflows)
        .where(eq(workflows.collegeId, collegeId))
        .orderBy(desc(workflows.updatedAt));
      return response.success(res, list.map(formatWorkflow));
    }

    return response.success(res, data.map(formatWorkflow));
  } catch (err) { next(err); }
});

// GET /api/config/workflows/:id — Get single workflow with full node graph
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !data) return response.notFound(res, 'Workflow not found');
    return response.success(res, formatWorkflow(data));
  } catch (err) { next(err); }
});

// POST /api/config/workflows — Create workflow
router.post('/', authenticate, requireRole('Super Admin', 'Admin'), validate(workflowSchema), auditMiddleware('workflow'), async (req, res, next) => {
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
      pipeline_id: req.body.pipelineId || null,
      trigger_type: req.body.triggerType,
      trigger_config: req.body.triggerConfig || {},
      nodes: req.body.nodes || [],
      edges: req.body.edges || [],
      is_active: req.body.isActive !== false,
      college_id: collegeId,
      created_by: validUserId,
    };

    const { data: wf, error } = await supabaseAdmin
      .from('workflows')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase workflow insert error:', error);
      throw error;
    }

    return response.created(res, formatWorkflow(wf), 'Workflow created');
  } catch (err) { next(err); }
});

// PUT /api/config/workflows/:id — Save workflow graph (nodes + edges)
router.put('/:id', authenticate, requireRole('Super Admin', 'Admin'), validate(workflowSchema.partial()), auditMiddleware('workflow'), async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!existing) return response.notFound(res, 'Workflow not found');
    req._auditOldValue = existing;

    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.description !== undefined) updatePayload.description = req.body.description;
    if (req.body.branchId !== undefined) updatePayload.branch_id = req.body.branchId;
    if (req.body.pipelineId !== undefined) updatePayload.pipeline_id = req.body.pipelineId;
    if (req.body.triggerType !== undefined) updatePayload.trigger_type = req.body.triggerType;
    if (req.body.triggerConfig !== undefined) updatePayload.trigger_config = req.body.triggerConfig;
    if (req.body.nodes !== undefined) updatePayload.nodes = req.body.nodes;
    if (req.body.edges !== undefined) updatePayload.edges = req.body.edges;
    if (req.body.isActive !== undefined) updatePayload.is_active = req.body.isActive;
    updatePayload.version = (existing.version || 1) + 1;
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('workflows')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !updated) return response.notFound(res, 'Workflow not found');
    return response.success(res, formatWorkflow(updated), 'Workflow updated');
  } catch (err) { next(err); }
});

// DELETE /api/config/workflows/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('workflow'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('workflows')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(workflows).where(eq(workflows.id, req.params.id));
    }
    return response.success(res, null, 'Workflow deleted');
  } catch (err) { next(err); }
});

// POST /api/config/workflows/:id/execute — Manually test/run workflow
router.post('/:id/execute', authenticate, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await WorkflowEngine.executeWorkflow(req.params.id, payload, {
      eventType: 'manual_test',
      user: req.user,
    });

    return response.success(res, result, 'Workflow triggered');
  } catch (err) { next(err); }
});

// GET /api/config/workflows/:id/executions — Execution history
router.get('/:id/executions', authenticate, async (req, res, next) => {
  try {
    const { data: executions, error } = await supabaseAdmin
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', req.params.id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return response.success(res, executions || []);
  } catch (err) { next(err); }
});

// GET /api/config/workflows/executions/:executionId/logs — Execution step logs
router.get('/executions/:executionId/logs', authenticate, async (req, res, next) => {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('workflow_execution_logs')
      .select('*')
      .eq('execution_id', req.params.executionId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return response.success(res, logs || []);
  } catch (err) { next(err); }
});

export default router;
