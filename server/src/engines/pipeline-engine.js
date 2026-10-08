import { supabaseAdmin } from '../config/supabase.js';
import { ForbiddenError, BadRequestError } from '../utils/errors.js';
import { WorkflowEngine } from './workflow-engine.js';
import { NotificationEngine } from './notification-engine.js';
import { AuditEngine } from './audit-engine.js';
import { PermissionEngine } from './permission-engine.js';

/**
 * Pipeline Engine — State machine, transition validation, and stage lifecycle actions.
 * Powered via Supabase Cloud with full audit logging and workflow triggering.
 */
export class PipelineEngine {
  /**
   * Check if a transition from request.stageId to targetStageId is allowed
   */
  static async validateTransition({ user, request, targetStageId }) {
    if (request.stage_id === targetStageId || request.stageId === targetStageId) {
      return { allowed: true };
    }

    // Check user permission for stage transition
    if (user && !user.isSuperAdmin) {
      const canEditStage = await PermissionEngine.canPerform(user, 'stage', targetStageId, 'edit');
      if (!canEditStage) {
        throw new ForbiddenError('Your role does not have permission to transition this request stage');
      }
    }

    // 1. Fetch target stage details
    const { data: targetStage, error: stageErr } = await supabaseAdmin
      .from('pipeline_stages')
      .select('*')
      .eq('id', targetStageId)
      .maybeSingle();

    if (stageErr || !targetStage) {
      throw new BadRequestError('Target stage does not exist in pipeline');
    }

    const currentStageId = request.stage_id || request.stageId;
    const pipelineId = request.pipeline_id || request.pipelineId;

    // 2. If transition rules are configured, verify explicit transition rule
    const { data: transitions } = await supabaseAdmin
      .from('stage_transitions')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('from_stage_id', currentStageId)
      .eq('to_stage_id', targetStageId);

    if (transitions && transitions.length > 0) {
      const rule = transitions[0];
      const allowedRoles = rule.allowed_role_ids || rule.allowedRoleIds || [];

      // Check role authorization if restricted
      if (allowedRoles.length > 0 && !user?.isSuperAdmin) {
        const userRoleIds = (user?.roles || []).map(r => r.id || r.roleId);
        const hasRole = allowedRoles.some(roleId => userRoleIds.includes(roleId));
        if (!hasRole) {
          throw new ForbiddenError('Your role does not have permission to execute this stage transition');
        }
      }
    }

    // 3. Check required fields for target stage
    const requiredFieldIds = targetStage.required_field_ids || targetStage.requiredFieldIds || [];
    if (requiredFieldIds.length > 0) {
      const currentValues = request.custom_field_values || request.customFieldValues || {};
      for (const fieldId of requiredFieldIds) {
        const { data: field } = await supabaseAdmin
          .from('custom_fields')
          .select('name, label')
          .eq('id', fieldId)
          .maybeSingle();

        if (field) {
          const val = currentValues[field.name] !== undefined ? currentValues[field.name] : currentValues[fieldId];
          if (val === undefined || val === null || val === '') {
            throw new BadRequestError(`Field '${field.label}' is required before advancing to ${targetStage.name}`);
          }
        }
      }
    }

    return { allowed: true, targetStage };
  }

  /**
   * Execute stage transition with full lifecycle hooks:
   * Validation -> Exit actions -> DB update -> History log -> Audit log -> Notification -> Entry actions -> Workflows
   */
  static async transition({ user, requestId, targetStageId, reason = '' }) {
    // 1. Fetch current request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*)')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !request) {
      throw new BadRequestError('Request not found');
    }

    const fromStageId = request.stage_id;
    const { targetStage } = await this.validateTransition({ user, request, targetStageId });

    // 2. Update Request stage
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('requests')
      .update({
        stage_id: targetStageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*)')
      .single();

    if (updateErr) throw updateErr;

    // 3. Record status progression history
    let validUserId = null;
    if (user?.id) {
      const { data: u } = await supabaseAdmin.from('users').select('id').eq('id', user.id).maybeSingle();
      if (u?.id) validUserId = u.id;
    }

    await supabaseAdmin.from('request_status_history').insert({
      request_id: requestId,
      from_stage_id: fromStageId,
      to_stage_id: targetStageId,
      changed_by: validUserId,
      reason: reason || `Transitioned to ${targetStage.name}`,
      timestamp: new Date().toISOString(),
    });

    // 4. Record Audit Log
    await AuditEngine.log({
      userId: validUserId,
      action: 'STAGE_CHANGED',
      entityType: 'request',
      entityId: requestId,
      oldValue: { stageId: fromStageId, stageName: request.stage?.name },
      newValue: { stageId: targetStageId, stageName: targetStage.name, reason },
    });

    // 5. Notify Applicant / Creator
    if (request.created_by) {
      await NotificationEngine.send({
        userId: request.created_by,
        type: 'stage_change',
        title: `Application ${request.request_number} Updated`,
        body: `Your request "${request.title}" has moved to: ${targetStage.name}.`,
        entityType: 'request',
        entityId: requestId,
      });
    }

    // 6. Notify Assigned Advisor if different from actor
    if (request.assigned_user_id && request.assigned_user_id !== validUserId) {
      await NotificationEngine.send({
        userId: request.assigned_user_id,
        type: 'stage_change',
        title: `Assigned Record ${request.request_number} Moved Stage`,
        body: `Record "${request.title}" advanced to: ${targetStage.name}.`,
        entityType: 'request',
        entityId: requestId,
      });
    }

    // 7. Trigger associated automated workflows for this stage change
    try {
      await WorkflowEngine.triggerEvent({
        eventType: 'STAGE_CHANGED',
        pipelineId: request.pipeline_id,
        stageId: targetStageId,
        payload: {
          request: updated,
          previousStageId: fromStageId,
          user: user || {},
        },
      });
    } catch (err) {
      console.error('[PipelineEngine] Workflow trigger failed during stage change:', err.message);
    }

    return updated;
  }
}
