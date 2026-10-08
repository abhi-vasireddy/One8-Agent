import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CampusFlowAgent } from '../ai/agent.js';
import { NotificationEngine } from '../engines/notification-engine.js';
import { AuditEngine } from '../engines/audit-engine.js';
import { WorkflowEngine } from '../engines/workflow-engine.js';
import * as response from '../utils/api-response.js';

const router = Router();

const postMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional().default({}),
});

const aiAssistSchema = z.object({
  action: z.enum(['summarize', 'draft_reply']),
  tone: z.enum(['friendly', 'formal', 'urgent']).optional().default('friendly'),
  promptNotes: z.string().optional().default(''),
});

// Helper: Ensure valid user id exists
async function getValidUserId(reqUser) {
  if (!reqUser?.id) return null;
  const { data: u } = await supabaseAdmin.from('users').select('id').eq('id', reqUser.id).maybeSingle();
  if (u?.id) return u.id;
  // Upsert user if needed
  const { data: upserted } = await supabaseAdmin.from('users').upsert({
    id: reqUser.id,
    email: reqUser.email || 'user@campusflow.edu',
    name: reqUser.name || 'Staff Advisor',
    college_id: reqUser.collegeId || '11111111-1111-1111-1111-111111111111',
    is_active: true,
  }).select().single();
  return upserted?.id || reqUser.id;
}

// ─────────────────────────────────────────────────────────────
// 1. GET /api/threads — List all CRM conversation threads
// ─────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { pipelineId, search, status } = req.query;

    // Fetch requests
    let query = supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*), assignedUser:users!requests_assigned_user_id_fkey(id, name, email)')
      .order('updated_at', { ascending: false });

    if (pipelineId) {
      query = query.eq('pipeline_id', pipelineId);
    }

    const { data: requestsList, error: reqErr } = await query;
    if (reqErr) throw reqErr;

    // Fetch all conversations for these requests
    const requestIds = (requestsList || []).map(r => r.id);
    let convMap = {};
    let messagesMap = {};

    if (requestIds.length > 0) {
      const { data: convs } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .in('request_id', requestIds);

      (convs || []).forEach(c => {
        convMap[c.request_id] = c;
      });

      const convIds = (convs || []).map(c => c.id);
      if (convIds.length > 0) {
        const { data: msgs } = await supabaseAdmin
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });

        (msgs || []).forEach(m => {
          if (!messagesMap[m.conversation_id]) messagesMap[m.conversation_id] = [];
          messagesMap[m.conversation_id].push(m);
        });
      }
    }

    // Build threads list
    const threads = (requestsList || []).map(reqItem => {
      const conv = convMap[reqItem.id];
      const msgs = conv ? (messagesMap[conv.id] || []) : [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

      return {
        id: conv?.id || `conv-placeholder-${reqItem.id}`,
        requestId: reqItem.id,
        requestNumber: reqItem.request_number,
        title: reqItem.title,
        description: reqItem.description,
        pipelineId: reqItem.pipeline_id,
        pipelineName: reqItem.pipeline?.name || 'General Pipeline',
        stageId: reqItem.stage_id,
        stageName: reqItem.stage?.name || 'Initiated',
        stageColor: reqItem.stage?.color || '#3B82F6',
        priority: reqItem.priority || 'medium',
        customFieldValues: reqItem.custom_field_values || {},
        assignedUser: reqItem.assignedUser,
        createdAt: reqItem.created_at,
        updatedAt: reqItem.updated_at,
        messageCount: msgs.length,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          senderType: lastMsg.sender_type,
          isInternal: lastMsg.metadata?.isInternal || false,
          authorName: lastMsg.metadata?.authorName || (lastMsg.sender_type === 'ai' ? 'CampusFlow AI' : 'Team Member'),
          createdAt: lastMsg.created_at,
        } : null,
      };
    });

    // Optional text filter
    let filtered = threads;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title?.toLowerCase().includes(q) || 
        t.requestNumber?.toLowerCase().includes(q) ||
        t.lastMessage?.content?.toLowerCase().includes(q) ||
        t.pipelineName?.toLowerCase().includes(q)
      );
    }

    return response.success(res, filtered);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 2. GET /api/threads/request/:requestId — Get thread for request
// ─────────────────────────────────────────────────────────────
router.get('/request/:requestId', authenticate, async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // 1. Fetch Request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*), assignedUser:users!requests_assigned_user_id_fkey(id, name, email)')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr) throw reqErr;
    if (!request) return response.notFound(res, 'Request not found');

    // 2. Fetch or create conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle();

    const validUserId = await getValidUserId(req.user);

    if (!conversation) {
      const { data: createdConv, error: createConvErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          request_id: requestId,
          user_id: validUserId,
          type: 'human',
        })
        .select()
        .single();

      if (createConvErr) throw createConvErr;
      conversation = createdConv;

      // Seed initial friendly welcome message to kick off the thread
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'system',
        sender_id: validUserId,
        content: `Thread initialized for application ${request.request_number} (${request.title}). Collaborative notes and updates are tracked here.`,
        metadata: { isInternal: false, authorName: 'CampusFlow System' },
      });
    }

    // 3. Fetch messages for conversation
    const { data: rawMessages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // 4. Fetch status progression history
    const { data: history } = await supabaseAdmin
      .from('request_status_history')
      .select('*, changedByUser:users(id, name)')
      .eq('request_id', requestId)
      .order('timestamp', { ascending: true });

    // 5. Combine messages and status events into a unified chronological stream
    const timeline = [];

    (rawMessages || []).forEach(m => {
      timeline.push({
        id: m.id,
        type: 'message',
        senderType: m.sender_type,
        senderId: m.sender_id,
        authorName: m.metadata?.authorName || (m.sender_type === 'ai' ? 'CampusFlow AI' : m.sender_type === 'system' ? 'System Event' : 'Team Member'),
        authorAvatar: m.metadata?.authorAvatar,
        isInternal: Boolean(m.metadata?.isInternal),
        content: m.content,
        timestamp: m.created_at,
        metadata: m.metadata || {},
      });
    });

    (history || []).forEach(h => {
      timeline.push({
        id: `event-${h.id}`,
        type: 'status_transition',
        reason: h.reason || 'Stage updated',
        authorName: h.changedByUser?.name || 'Workflow Automation',
        timestamp: h.timestamp,
        fromStageId: h.from_stage_id,
        toStageId: h.to_stage_id,
      });
    });

    // Sort combined timeline by timestamp ascending
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return response.success(res, {
      request: {
        id: request.id,
        requestNumber: request.request_number,
        title: request.title,
        description: request.description,
        pipelineId: request.pipeline_id,
        pipelineName: request.pipeline?.name,
        stageId: request.stage_id,
        stageName: request.stage?.name,
        stageColor: request.stage?.color,
        priority: request.priority,
        customFieldValues: request.custom_field_values || {},
        assignedUser: request.assignedUser,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      },
      conversation,
      messages: rawMessages || [],
      timeline,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 3. POST /api/threads/request/:requestId/messages — Post message or note
// ─────────────────────────────────────────────────────────────
router.post('/request/:requestId/messages', authenticate, validate(postMessageSchema), async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { content, isInternal, metadata } = req.body;

    const validUserId = await getValidUserId(req.user);

    // Get or create conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle();

    if (!conversation) {
      const { data: createdConv, error: createConvErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          request_id: requestId,
          user_id: validUserId,
          type: 'human',
        })
        .select()
        .single();
      if (createConvErr) throw createConvErr;
      conversation = createdConv;
    }

    // Insert message
    const { data: newMessage, error: msgErr } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'user',
        sender_id: validUserId,
        content,
        metadata: {
          ...metadata,
          isInternal: Boolean(isInternal),
          authorName: req.user.name || 'Advisor',
          authorEmail: req.user.email,
        },
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // Update request updated_at timestamp & fetch request info for notifications
    const { data: reqData } = await supabaseAdmin
      .from('requests')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('*')
      .maybeSingle();

    // Audit Logging
    await AuditEngine.log({
      userId: validUserId,
      action: isInternal ? 'INTERNAL_NOTE_CREATED' : 'MESSAGE_SENT',
      entityType: 'request',
      entityId: requestId,
      newValue: { messageId: newMessage.id, isInternal: Boolean(isInternal) },
    });

    // In-App Notification (for public messages)
    if (!isInternal && reqData) {
      if (validUserId === reqData.created_by) {
        // Submitter sent message -> notify assigned advisor if assigned
        if (reqData.assigned_user_id) {
          await NotificationEngine.send({
            userId: reqData.assigned_user_id,
            type: 'message',
            title: `Applicant Update: ${reqData.request_number}`,
            body: `${req.user.name || 'Applicant'}: "${content.slice(0, 100)}"`,
            entityType: 'request',
            entityId: requestId,
          });
        }
      } else {
        // Staff replied -> notify submitter
        if (reqData.created_by) {
          await NotificationEngine.send({
            userId: reqData.created_by,
            type: 'message',
            title: `Advisor Reply: ${reqData.request_number}`,
            body: `${req.user.name || 'Advisor'}: "${content.slice(0, 100)}"`,
            entityType: 'request',
            entityId: requestId,
          });
        }
      }
    }

    // Trigger MESSAGE_CREATED Workflows
    try {
      await WorkflowEngine.triggerEvent({
        eventType: 'MESSAGE_CREATED',
        pipelineId: reqData?.pipeline_id,
        stageId: reqData?.stage_id,
        payload: {
          message: newMessage,
          request: reqData,
          user: req.user,
          isInternal: Boolean(isInternal),
        },
      });
    } catch (wfErr) {
      console.warn('[Threads] Workflow trigger error:', wfErr.message);
    }

    return response.created(res, {
      id: newMessage.id,
      type: 'message',
      senderType: 'user',
      senderId: validUserId,
      authorName: req.user.name || 'Advisor',
      isInternal: Boolean(isInternal),
      content: newMessage.content,
      timestamp: newMessage.created_at,
      metadata: newMessage.metadata,
    }, 'Message added to thread');
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 4. POST /api/threads/request/:requestId/ai-assist — Friendly AI assist
// ─────────────────────────────────────────────────────────────
router.post('/request/:requestId/ai-assist', authenticate, validate(aiAssistSchema), async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action, tone, promptNotes } = req.body;

    // Fetch request details
    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*)')
      .eq('id', requestId)
      .single();

    if (!request) return response.notFound(res, 'Request not found');

    // Fetch conversation messages
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('request_id', requestId)
      .maybeSingle();

    let messages = [];
    if (conversation?.id) {
      const { data: rawMsgs } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      messages = rawMsgs || [];
    }

    const historySummary = messages.map(m => `${m.metadata?.isInternal ? '[INTERNAL NOTE]' : '[MESSAGE]'} ${m.metadata?.authorName || m.sender_type}: ${m.content}`).join('\n');

    let aiPrompt = '';
    if (action === 'summarize') {
      aiPrompt = `You are a friendly, helpful assistant for university staff. 
Summarize the current situation for Application/Request #${request.request_number} ("${request.title}").
Pipeline: ${request.pipeline?.name}, Current Stage: ${request.stage?.name}, Priority: ${request.priority}.
Custom Attributes: ${JSON.stringify(request.custom_field_values || {})}.
Recent Thread Activity:
${historySummary || 'No messages yet.'}

Provide a friendly 2-3 bullet point summary and suggest a clear, constructive next step for the advisor.`;
    } else {
      aiPrompt = `You are a friendly university advisor communicating with an applicant/student regarding Application #${request.request_number} ("${request.title}").
Current Stage: ${request.stage?.name}.
Custom Attributes: ${JSON.stringify(request.custom_field_values || {})}.
Advisor Extra Instructions: "${promptNotes || 'Provide an encouraging, clear update on their application status.'}"
Tone: Friendly, encouraging, and clear.
Draft a warm, polite message that the advisor can review and send directly to the student.`;
    }

    const aiRes = await CampusFlowAgent.processMessage({
      user: req.user,
      collegeId: req.user.collegeId,
      message: aiPrompt,
      conversationHistory: [],
    });

    return response.success(res, {
      action,
      suggestion: aiRes?.reply || 'I am ready to help you craft a friendly update for this student.',
    });
  } catch (err) { next(err); }
});

export default router;
