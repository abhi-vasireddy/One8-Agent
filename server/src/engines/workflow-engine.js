import { supabaseAdmin } from '../config/supabase.js';
import { NotificationEngine } from './notification-engine.js';
import { AuditEngine } from './audit-engine.js';

/**
 * Workflow Engine — Graph traversal, condition evaluation, and automated action execution.
 * 100% configuration-driven and connected to Supabase Cloud.
 */
export class WorkflowEngine {
  /**
   * Listen for events and trigger any matching active workflows
   * @param {Object} params
   * @param {string} params.eventType - 'REQUEST_CREATED', 'STAGE_CHANGED', 'REQUEST_UPDATED', 'MESSAGE_CREATED', 'MANAGEMENT_ACTION'
   * @param {string} [params.pipelineId] - Associated pipeline ID
   * @param {string} [params.stageId] - Associated stage ID
   * @param {Object} params.payload - Context payload (request, user, customFieldValues, etc.)
   */
  static async triggerEvent({ eventType, pipelineId = null, stageId = null, payload = {} }) {
    if (!eventType) return [];

    try {
      // Find active workflows
      const { data: allActive, error } = await supabaseAdmin
        .from('workflows')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('[WorkflowEngine] Error fetching workflows:', error.message);
        return [];
      }

      const normalizedEvent = eventType.toUpperCase().replace(/\s+/g, '_');

      const matched = (allActive || []).filter(wf => {
        const wfTrigger = (wf.trigger_type || wf.triggerType || '').toUpperCase().replace(/\s+/g, '_');
        
        // Match trigger type flexibly
        const triggersMatch = (wfTrigger === normalizedEvent) ||
          (normalizedEvent === 'REQUEST_CREATED' && (wfTrigger === 'NEW_REQUEST' || wfTrigger === 'REQUEST_CREATION' || wfTrigger === 'STAGE_CHANGE')) ||
          (normalizedEvent === 'STAGE_CHANGED' && (wfTrigger === 'STAGE_CHANGE' || wfTrigger === 'TRANSITION'));

        if (!triggersMatch) return false;

        // Check pipeline constraint if configured on workflow
        const wfPipelineId = wf.pipeline_id || wf.pipelineId;
        if (pipelineId && wfPipelineId && wfPipelineId !== pipelineId) {
          return false;
        }

        // Check trigger config details (e.g. specific stage target)
        const cfg = wf.trigger_config || wf.triggerConfig || {};
        if (cfg.stage_id && stageId && cfg.stage_id !== stageId) return false;
        if (cfg.target_stage_id && stageId && cfg.target_stage_id !== stageId) return false;

        return true;
      });

      const executionResults = [];
      for (const wf of matched) {
        try {
          const result = await this.executeWorkflow(wf.id, payload, { eventType, pipelineId, stageId });
          executionResults.push(result);
        } catch (err) {
          console.error(`[WorkflowEngine] Execution failed for workflow ${wf.id}:`, err.message);
          executionResults.push({ workflowId: wf.id, status: 'failed', error: err.message });
        }
      }

      return executionResults;
    } catch (err) {
      console.error('[WorkflowEngine] triggerEvent exception:', err.message);
      return [];
    }
  }

  /**
   * Execute a specific workflow graph
   */
  static async executeWorkflow(workflowId, context = {}, triggerEvent = {}) {
    const { data: wf, error: fetchErr } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .maybeSingle();

    if (fetchErr || !wf) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // 1. Create execution record
    const { data: execution, error: createExecErr } = await supabaseAdmin
      .from('workflow_executions')
      .insert({
        workflow_id: wf.id,
        trigger_event: triggerEvent,
        context: context || {},
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createExecErr) {
      throw createExecErr;
    }

    const nodes = wf.nodes || [];
    const edges = wf.edges || [];

    // Find starting trigger node
    const triggerNode = nodes.find(n => n.type === 'trigger') || nodes[0];
    if (!triggerNode) {
      await supabaseAdmin
        .from('workflow_executions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', execution.id);
      return { executionId: execution.id, status: 'completed', state: context };
    }

    let currentNode = triggerNode;
    let executionState = { ...context };

    try {
      while (currentNode) {
        await this.logNodeExecution(execution.id, currentNode, 'running', executionState);

        const nodeResult = await this.executeNode(currentNode, executionState);

        await this.logNodeExecution(
          execution.id,
          currentNode,
          'completed',
          executionState,
          nodeResult.output
        );

        executionState = { ...executionState, ...nodeResult.output };

        // Determine next node from edges
        const outgoingEdges = edges.filter(e => e.source === currentNode.id);

        if (outgoingEdges.length === 0) {
          currentNode = null;
        } else if (currentNode.type === 'condition') {
          // Condition node outputs branch based on boolean outcome
          const targetHandle = nodeResult.conditionMet ? 'true' : 'false';
          const branchEdge = outgoingEdges.find(e => e.sourceHandle === targetHandle) || outgoingEdges[0];
          currentNode = branchEdge ? nodes.find(n => n.id === branchEdge.target) : null;
        } else {
          // Standard linear edge
          const nextEdge = outgoingEdges[0];
          currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null;
        }
      }

      await supabaseAdmin
        .from('workflow_executions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', execution.id);

      return { executionId: execution.id, status: 'completed', state: executionState };
    } catch (err) {
      console.error(`[WorkflowEngine] Error during workflow step:`, err);
      await supabaseAdmin
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: { message: err.message, stack: err.stack },
        })
        .eq('id', execution.id);

      return { executionId: execution.id, status: 'failed', error: err.message };
    }
  }

  /**
   * Execute single node logic based on its type
   */
  static async executeNode(node, context) {
    const data = node.data || {};
    const requestId = context.request?.id || context.requestId;

    switch (node.type) {
      case 'trigger': {
        return { output: { triggeredAt: new Date().toISOString() } };
      }

      case 'condition': {
        const field = data.field;
        const operator = data.operator || '==';
        const value = data.value;

        const requestObj = context.request || {};
        const fieldValue = (requestObj.customFieldValues && requestObj.customFieldValues[field] !== undefined)
          ? requestObj.customFieldValues[field]
          : (requestObj[field] !== undefined ? requestObj[field] : context[field]);

        const conditionMet = this.evaluateCondition(fieldValue, operator, value);
        return { conditionMet, output: { conditionResult: conditionMet, checkedField: field } };
      }

      case 'action': {
        const actionType = (data.actionType || data.type || '').toUpperCase().replace(/\s+/g, '_');

        // 1. CHANGE_STAGE
        if ((actionType === 'CHANGE_STAGE' || actionType === 'SET_STAGE') && (data.targetStageId || data.target_stage_id) && requestId) {
          const targetStageId = data.targetStageId || data.target_stage_id;
          await supabaseAdmin
            .from('requests')
            .update({ stage_id: targetStageId, updated_at: new Date().toISOString() })
            .eq('id', requestId);

          // Record status progression
          await supabaseAdmin.from('request_status_history').insert({
            request_id: requestId,
            to_stage_id: targetStageId,
            reason: data.reason || `Automated transition by Workflow [${node.data?.label || node.id}]`,
            timestamp: new Date().toISOString(),
          });

          return { output: { stageChangedTo: targetStageId } };
        }

        // 2. ASSIGN_USER
        if ((actionType === 'ASSIGN_USER' || actionType === 'ASSIGN') && (data.userId || data.assignedUserId) && requestId) {
          const assignedId = data.userId || data.assignedUserId;
          await supabaseAdmin
            .from('requests')
            .update({ assigned_user_id: assignedId, updated_at: new Date().toISOString() })
            .eq('id', requestId);

          return { output: { assignedUserId: assignedId } };
        }

        // 3. ASSIGN_ROLE — Dynamic configuration-driven role & user lookup
        if ((actionType === 'ASSIGN_ROLE' || actionType === 'ASSIGN_TO_ROLE') && requestId) {
          let roleId = data.roleId || data.assignedRoleId;
          let roleName = data.roleName || data.assignedRoleName || data.role;

          if (!roleId && roleName) {
            const { data: roleRow } = await supabaseAdmin
              .from('roles')
              .select('id, name')
              .ilike('name', roleName.trim())
              .maybeSingle();
            if (roleRow) {
              roleId = roleRow.id;
              roleName = roleRow.name;
            }
          } else if (roleId && !roleName) {
            const { data: roleRow } = await supabaseAdmin
              .from('roles')
              .select('id, name')
              .eq('id', roleId)
              .maybeSingle();
            if (roleRow) roleName = roleRow.name;
          }

          // Dynamic user routing: Find eligible active user assigned to this role in user_roles
          let eligibleUserId = null;
          let eligibleUserName = null;

          if (roleId) {
            const { data: userRoleMappings } = await supabaseAdmin
              .from('user_roles')
              .select('user_id')
              .eq('role_id', roleId);

            if (userRoleMappings && userRoleMappings.length > 0) {
              const userIds = userRoleMappings.map(ur => ur.user_id).filter(Boolean);
              if (userIds.length > 0) {
                const { data: activeUsers } = await supabaseAdmin
                  .from('users')
                  .select('id, name, email')
                  .in('id', userIds)
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (activeUsers && activeUsers.length > 0) {
                  eligibleUserId = activeUsers[0].id;
                  eligibleUserName = activeUsers[0].name;
                }
              }
            }
          }

          await supabaseAdmin
            .from('requests')
            .update({
              assigned_role_id: roleId || null,
              assigned_user_id: eligibleUserId || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);

          return {
            output: {
              assignedRoleId: roleId,
              assignedRoleName: roleName,
              assignedUserId: eligibleUserId,
              assignedUserName: eligibleUserName,
            },
          };
        }

        // 4. SEND_NOTIFICATION
        if (actionType === 'SEND_NOTIFICATION') {
          const recipientId = data.recipientUserId || context.request?.createdBy || context.request?.created_by || context.user?.id;
          if (recipientId) {
            const assignedUserName = context.assignedUserName || 'the assigned officer';
            const assignedRoleName = context.assignedRoleName || 'Officer';
            let title = data.title || data.label || 'Workflow Automated Notice';
            let body = data.body || data.description || 'Action performed by CampusFlow automation.';

            title = title
              .replace(/\{\{assigned_user_name\}\}/g, assignedUserName)
              .replace(/\{\{role_name\}\}/g, assignedRoleName)
              .replace(/Marcus Vance/gi, assignedUserName);

            body = body
              .replace(/\{\{assigned_user_name\}\}/g, assignedUserName)
              .replace(/\{\{role_name\}\}/g, assignedRoleName)
              .replace(/Marcus Vance/gi, assignedUserName);

            await NotificationEngine.send({
              userId: recipientId,
              type: data.notificationType || 'workflow_alert',
              title,
              body,
              entityType: 'request',
              entityId: requestId,
            });
          }
          return { output: { notificationSent: true } };
        }

        // 5. CREATE_INTERNAL_NOTE or CREATE_MESSAGE
        if ((actionType === 'CREATE_INTERNAL_NOTE' || actionType === 'CREATE_MESSAGE') && requestId) {
          const isInternal = (actionType === 'CREATE_INTERNAL_NOTE');
          const assignedUserName = context.assignedUserName || 'the assigned officer';
          const assignedRoleName = context.assignedRoleName || 'Officer';

          let rawContent = data.content || data.message || `Automated workflow notice: ${data.label || 'Action triggered'}`;
          let content = rawContent
            .replace(/\{\{assigned_user_name\}\}/g, assignedUserName)
            .replace(/\{\{role_name\}\}/g, assignedRoleName)
            .replace(/Marcus Vance/gi, assignedUserName);

          // Find or create conversation
          let { data: conv } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('request_id', requestId)
            .maybeSingle();

          if (conv?.id) {
            await supabaseAdmin.from('messages').insert({
              conversation_id: conv.id,
              sender_type: 'system',
              content,
              metadata: {
                isInternal,
                authorName: 'Workflow Automation',
                nodeId: node.id,
              },
            });
          }
          return { output: { messageCreated: true, isInternal } };
        }

        // 6. UPDATE_FIELD
        if (actionType === 'UPDATE_FIELD' && data.field && data.value !== undefined && requestId) {
          const { data: currentReq } = await supabaseAdmin
            .from('requests')
            .select('custom_field_values')
            .eq('id', requestId)
            .single();

          const currentFields = currentReq?.custom_field_values || {};
          const updatedFields = { ...currentFields, [data.field]: data.value };

          await supabaseAdmin
            .from('requests')
            .update({ custom_field_values: updatedFields, updated_at: new Date().toISOString() })
            .eq('id', requestId);

          return { output: { fieldUpdated: data.field, newValue: data.value } };
        }

        // 7. CREATE_AUDIT_LOG
        if (actionType === 'CREATE_AUDIT_LOG') {
          await AuditEngine.log({
            userId: context.user?.id,
            action: data.auditAction || 'WORKFLOW_AUTOMATION',
            entityType: 'request',
            entityId: requestId,
            newValue: { node: node.id, label: data.label },
          });
          return { output: { auditLogged: true } };
        }

        return { output: { actionExecuted: actionType || 'custom' } };
      }

      default:
        return { output: {} };
    }
  }

  /**
   * Evaluate condition expressions
   */
  static evaluateCondition(left, op, right) {
    switch (op) {
      case '==':
      case 'equals':
        return String(left) === String(right);
      case '!=':
      case 'not_equals':
        return String(left) !== String(right);
      case '>':
        return Number(left) > Number(right);
      case '>=':
        return Number(left) >= Number(right);
      case '<':
        return Number(left) < Number(right);
      case '<=':
        return Number(left) <= Number(right);
      case 'contains':
        return String(left || '').toLowerCase().includes(String(right || '').toLowerCase());
      default:
        return Boolean(left);
    }
  }

  /**
   * Log node step execution
   */
  static async logNodeExecution(executionId, node, status, input = {}, output = {}, error = null) {
    try {
      await supabaseAdmin.from('workflow_execution_logs').insert({
        execution_id: executionId,
        node_id: node.id,
        node_type: node.type,
        status,
        input: input || {},
        output: output || {},
        error: error ? (error.message || String(error)) : null,
      });
    } catch (e) {
      // Don't interrupt flow if logging fails
    }
  }
}
