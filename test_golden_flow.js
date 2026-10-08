/**
 * CAMPUSFLOW AI — GOLDEN END-TO-END VERIFICATION TEST (ISOLATED TEST FIXTURES)
 * 
 * Verifies the complete, unified lifecycle from Student intake through 
 * automated workflow triaging, assignment, thread discussion, stage changes,
 * notifications, audit logging, authorization enforcement, and AI copilot awareness.
 * 
 * NOTE: Operates 100% on programmatic test fixtures — zero dependency on pre-seeded
 * demo users, demo requests, demo pipelines, or hardcoded personas.
 */

import { supabaseAdmin } from './server/src/config/supabase.js';
import { env } from './server/src/config/env.js';

const API_BASE = 'http://localhost:3001/api';

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // text response
  }

  return {
    status: res.status,
    data,
  };
}

let studentToken = '';
let officerToken = '';
let adminToken = '';
let studentUser = null;
let officerUser = null;
let adminUser = null;

let pipelineId = '';
let pipelineName = '';
let initialStage = null;
let underReviewStage = null;
let approvedStage = null;
let requiredFieldName = '';
let createdRequestId = '';
let createdRequestNumber = '';
let testWorkflow = null;

const testStudentEmail = `test.student.${Date.now()}@test.campusflow.local`;
const testOfficerEmail = `test.officer.${Date.now()}@test.campusflow.local`;
const testPassword = 'TestPassword@2026!';

async function runTest() {
  console.log('\n=============================================================');
  console.log('   CAMPUSFLOW AI — COMPLETE GOLDEN FLOW INTEGRATION TEST   ');
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP PHASE: Programmatic Test Fixtures (Isolated)
    // -------------------------------------------------------------
    console.log('--- SETUP: Programmatic Test Fixture Provisioning ---');

    // 0A. Authenticate as Bootstrap Super Admin
    const adminLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: env.auth.tempAdminEmail || 'admin@campusflow.local',
        password: env.auth.tempAdminPassword || 'CampusFlow@Admin2026!',
      },
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.data.token, 'Super Admin authenticated via bootstrap credentials');
    adminToken = adminLoginRes.data.data.token;
    adminUser = adminLoginRes.data.data.user;

    // 0B. Create Programmatic Test Users
    const createStudentRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        email: testStudentEmail,
        password: testPassword,
        name: 'Candidate Student (Test)',
        userType: 'Student',
        roleName: 'Student',
      },
    });
    assert(createStudentRes.status === 201, `Programmatic test student created: ${testStudentEmail}`);

    const createOfficerRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        email: testOfficerEmail,
        password: testPassword,
        name: 'Staff Admission Officer (Test)',
        userType: 'Management',
        roleName: 'Admission Officer',
      },
    });
    assert(createOfficerRes.status === 201, `Programmatic test officer created: ${testOfficerEmail}`);

    // 0C. Create Isolated Test Pipeline
    const pipeRes = await apiRequest('/config/pipelines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: `Admissions Process (${Date.now()})`,
        description: 'Dynamic end-to-end integration test pipeline',
        entityType: 'request',
        color: '#6366f1',
      },
    });
    assert(pipeRes.status === 201 && pipeRes.data.data.id, 'Dynamic test pipeline created via Admin API');
    pipelineId = pipeRes.data.data.id;
    pipelineName = pipeRes.data.data.name;

    // 0D. Discover Stages for Test Pipeline (seeded automatically on pipeline creation)
    const stagesFetchRes = await apiRequest(`/config/stages/pipelines/${pipelineId}/stages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const autoStages = stagesFetchRes.data.data || [];
    initialStage = autoStages.find(s => s.isInitial) || autoStages[0];
    underReviewStage = autoStages.find(s => s.name === 'Under Review') || autoStages[1];
    approvedStage = autoStages.find(s => s.name === 'Approved') || autoStages[2];

    // 0E. Configure Dynamic Required Field
    const fieldRes = await apiRequest('/config/fields', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        pipelineId,
        name: 'candidate_details',
        label: 'Candidate Details & Profile',
        fieldType: 'text',
        isRequired: true,
        entityType: 'request',
      },
    });
    assert(fieldRes.status === 201, 'Dynamic required custom field configured for test pipeline');
    requiredFieldName = 'candidate_details';

    // 0F. Configure Generic Workflow: ASSIGN_ROLE (Admission Officer) -> Dynamic routing
    const wfRes = await apiRequest('/workflows', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        pipelineId,
        name: `Auto-Routing for ${pipelineName}`,
        description: 'Fires upon application submission and dynamically routes to Admission Officer',
        triggerType: 'stage_change',
        triggerConfig: {
          pipeline_id: pipelineId,
          target_stage_id: initialStage.id,
        },
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 250, y: 50 },
            data: { label: 'Application Submitted' },
          },
          {
            id: 'node-2',
            type: 'action',
            position: { x: 250, y: 180 },
            data: {
              label: 'Assign Admission Officer',
              actionType: 'ASSIGN_ROLE',
              roleName: 'Admission Officer',
            },
          },
          {
            id: 'node-3',
            type: 'action',
            position: { x: 250, y: 300 },
            data: {
              label: 'Internal Intake Note',
              actionType: 'CREATE_INTERNAL_NOTE',
              content: 'Automated Triaging: Request assigned to configured {{role_name}} for preliminary review.',
            },
          },
          {
            id: 'node-4',
            type: 'action',
            position: { x: 250, y: 420 },
            data: {
              label: 'Audit Auto-Routing',
              actionType: 'CREATE_AUDIT_LOG',
              auditAction: 'WORKFLOW_AUTO_ASSIGNED',
            },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2' },
          { id: 'e2-3', source: 'node-2', target: 'node-3' },
          { id: 'e3-4', source: 'node-3', target: 'node-4' },
        ],
        isActive: true,
      },
    });
    assert(wfRes.status === 201 && wfRes.data.data.id, 'Generic ASSIGN_ROLE workflow configured dynamically');
    testWorkflow = wfRes.data.data;

    // -------------------------------------------------------------
    // STEP 1: Authenticate Personas with Real JWT Tokens
    // -------------------------------------------------------------
    console.log('\n--- STEP 1: Authenticate Personas ---');
    const studentAuth = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testStudentEmail, password: testPassword },
    });
    assert(studentAuth.status === 200 && studentAuth.data.data.token, 'Student authenticated with real credentials');
    studentToken = studentAuth.data.data.token;
    studentUser = studentAuth.data.data.user;

    const officerAuth = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testOfficerEmail, password: testPassword },
    });
    assert(officerAuth.status === 200 && officerAuth.data.data.token, 'Admission Officer authenticated with real credentials');
    officerToken = officerAuth.data.data.token;
    officerUser = officerAuth.data.data.user;

    // -------------------------------------------------------------
    // STEP 2: Dynamically Fetch Available Configured Pipelines
    // -------------------------------------------------------------
    console.log('\n--- STEP 2: Discover Configured Pipelines ---');
    const pipesRes = await apiRequest('/config/pipelines', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(pipesRes.status === 200 && pipesRes.data.data.length > 0, `Pipelines fetched dynamically (found ${pipesRes.data.data?.length})`);
    console.log(`    Selected Pipeline: "${pipelineName}" (${pipelineId})`);

    // Fetch Stages for Pipeline
    const stagesRes = await apiRequest(`/config/stages/pipelines/${pipelineId}/stages`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(stagesRes.status === 200 && stagesRes.data.data.length >= 2, `Pipeline stages fetched (${stagesRes.data.data.length} stages)`);
    console.log(`    Stages: [${stagesRes.data.data.map(s => s.name).join(' → ')}]`);

    // -------------------------------------------------------------
    // STEP 3: Discover Configured Custom Fields & Required Validation
    // -------------------------------------------------------------
    console.log('\n--- STEP 3: Discover Custom Fields ---');
    const fieldsRes = await apiRequest(`/config/fields?pipelineId=${pipelineId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(fieldsRes.status === 200 && fieldsRes.data.data.length > 0, `Custom fields loaded dynamically (${fieldsRes.data.data.length} fields)`);
    console.log(`    Required Field to validate: "${requiredFieldName}"`);

    // -------------------------------------------------------------
    // STEP 4: Test Validation — Reject Incomplete Request
    // -------------------------------------------------------------
    console.log('\n--- STEP 4: Required Field Validation Check ---');
    const invalidSubRes = await apiRequest('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        pipelineId,
        title: 'Automated Test Submission (Invalid)',
        customFieldValues: {},
      },
    });
    assert(invalidSubRes.status === 400, `Missing required field correctly rejected: "${invalidSubRes.data.message}"`);

    // -------------------------------------------------------------
    // STEP 5: Create Valid Request as Student
    // -------------------------------------------------------------
    console.log('\n--- STEP 5: Submit Valid Request as Student ---');
    const validSubRes = await apiRequest('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        pipelineId,
        title: 'Application for B.Tech Admissions (Autonomous Batch)',
        description: 'Prospective applicant submitting academic portfolio and preferences.',
        priority: 'high',
        customFieldValues: {
          [requiredFieldName]: 'Candidate Profile - Portfolio & Records',
        },
      },
    });
    assert(validSubRes.status === 201 && validSubRes.data.data.id, `Request created successfully: ${validSubRes.data.data.requestNumber}`);
    createdRequestId = validSubRes.data.data.id;
    createdRequestNumber = validSubRes.data.data.requestNumber;
    assert(validSubRes.data.data.stageId === initialStage.id, `Initial stage dynamically assigned to: "${initialStage.name}"`);

    // -------------------------------------------------------------
    // STEP 6: Verify Workflow Trigger & Dynamic ASSIGN_ROLE Routing
    // -------------------------------------------------------------
    console.log('\n--- STEP 6: Verify Workflow Execution & Assignment ---');
    await new Promise(r => setTimeout(r, 1200));

    const reqDetailsRes = await apiRequest(`/requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(reqDetailsRes.status === 200, 'Retrieved created request record');
    assert(
      reqDetailsRes.data.data.assignedUserId === officerUser.id,
      `Workflow dynamically routed & assigned request to active Admission Officer (${officerUser.id})`
    );

    // Verify workflow execution in DB
    const { data: wfExec } = await supabaseAdmin
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', testWorkflow.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    assert(wfExec && wfExec.status === 'completed', `Workflow status verified in database: "${wfExec?.status}"`);

    // -------------------------------------------------------------
    // STEP 7: Verify Automatic Thread Initialization & Intake Note
    // -------------------------------------------------------------
    console.log('\n--- STEP 7: Verify Thread & Collaboration Stream ---');
    const threadRes = await apiRequest(`/threads/request/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert(threadRes.status === 200 && threadRes.data.data.conversation, 'Collaborative thread created and linked to request');
    const messages = threadRes.data.data.messages || [];
    assert(messages.length >= 2, `Thread populated with initial events (found ${messages.length} messages)`);
    const internalNote = messages.find(m => m.metadata?.isInternal === true);
    assert(internalNote !== undefined, `Workflow automated internal triage note exists: "${internalNote?.content?.slice(0, 50)}..."`);

    // -------------------------------------------------------------
    // STEP 8: Verify In-App Notification Received by Student
    // -------------------------------------------------------------
    console.log('\n--- STEP 8: Verify In-App Notification for Student ---');
    const studentNotifs = await apiRequest('/notifications', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentNotifs.status === 200, 'Student notifications fetched');
    const intakeNotif = (studentNotifs.data.data || []).find(n => n.entityId === createdRequestId);
    assert(intakeNotif !== undefined, `Student received submission confirmation notice: "${intakeNotif?.title}"`);

    // -------------------------------------------------------------
    // STEP 9: Security Check — Verify Student CANNOT Advance Stage
    // -------------------------------------------------------------
    console.log('\n--- STEP 9: Security Enforcement (Student Stage Transition Blocked) ---');
    const unauthTransition = await apiRequest(`/requests/${createdRequestId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        targetStageId: underReviewStage.id,
        reason: 'Student attempting unauthorized self-approval',
      },
    });
    assert(unauthTransition.status === 403, `Unauthorized stage jump blocked with HTTP 403: "${unauthTransition.data.message}"`);

    // -------------------------------------------------------------
    // STEP 10: Security Check — Verify Non-Admin Officer Cannot Configure System
    // -------------------------------------------------------------
    console.log('\n--- STEP 10: Security Enforcement (Officer Pipeline Creation Blocked) ---');
    const unauthPipeCreate = await apiRequest('/config/pipelines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: { name: 'Unauthorized Pipeline Creation Attempt' },
    });
    assert(unauthPipeCreate.status === 403, `Non-admin blocked from pipeline creation (HTTP 403)`);

    // -------------------------------------------------------------
    // STEP 11: Admission Officer Replies in Collaborative Thread
    // -------------------------------------------------------------
    console.log('\n--- STEP 11: Management Reply in Collaborative Thread ---');
    const officerReplyRes = await apiRequest(`/threads/request/${createdRequestId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        content: 'Hello Candidate, your application documents look good! We are moving your profile to Under Review.',
        isInternal: false,
      },
    });
    assert(officerReplyRes.status === 201, 'Admission Officer sent external reply to applicant');

    // Verify student received message notification
    const studentNotifsAfter = await apiRequest('/notifications', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const replyNotif = (studentNotifsAfter.data.data || []).find(n => n.type === 'message' && n.entityId === createdRequestId);
    assert(replyNotif !== undefined, `Student received in-app alert for advisor reply: "${replyNotif?.title}"`);

    // -------------------------------------------------------------
    // STEP 12: Management Advances Stage to "Under Review"
    // -------------------------------------------------------------
    console.log('\n--- STEP 12: Authorized Stage Transition to Under Review ---');
    const transRes = await apiRequest(`/requests/${createdRequestId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        targetStageId: underReviewStage.id,
        reason: 'Formal verification completed by Admission Officer',
      },
    });
    assert(transRes.status === 200, `Stage transition succeeded: now in "${underReviewStage.name}"`);

    // -------------------------------------------------------------
    // STEP 13: Verify Status Progression History & Stage Change Notification
    // -------------------------------------------------------------
    console.log('\n--- STEP 13: Verify Status Progression & Notification ---');
    const updatedReqRes = await apiRequest(`/requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(updatedReqRes.data.data.stageId === underReviewStage.id, `Student sees updated stage: "${underReviewStage.name}"`);
    assert(updatedReqRes.data.data.history?.length >= 2, `Stage history tracks previous and current states (${updatedReqRes.data.data.history?.length} records)`);

    // -------------------------------------------------------------
    // STEP 14: Management Advances Stage to Final "Approved" (Resolution)
    // -------------------------------------------------------------
    console.log('\n--- STEP 14: Final Stage Resolution to Approved ---');
    const resolveRes = await apiRequest(`/requests/${createdRequestId}/transition`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        targetStageId: approvedStage.id,
        reason: 'Final admission decision approved',
      },
    });
    assert(resolveRes.status === 200, `Request successfully resolved to stage: "${approvedStage.name}"`);

    // -------------------------------------------------------------
    // STEP 15: Verify Complete Audit Log Trail
    // -------------------------------------------------------------
    console.log('\n--- STEP 15: Audit Trail Verification ---');
    const auditRes = await apiRequest('/config/audit-logs?limit=50', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditRes.status === 200, 'Audit log trail fetched by Super Admin');
    const logsForReq = (auditRes.data.data || []).filter(l => l.entityId === createdRequestId);
    assert(logsForReq.length >= 3, `Full audit trail captured ${logsForReq.length} distinct events for this request`);
    const actions = logsForReq.map(l => l.action);
    console.log(`    Recorded Audit Actions: [${actions.join(', ')}]`);
    assert(actions.includes('REQUEST_CREATED'), 'Audit log contains REQUEST_CREATED');
    assert(actions.includes('INTERNAL_NOTE_CREATED') || actions.includes('MESSAGE_SENT'), 'Audit log contains message/note actions');
    assert(actions.includes('STAGE_CHANGED'), 'Audit log contains STAGE_CHANGED');

    // -------------------------------------------------------------
    // STEP 16: Verify AI Agent Context Awareness for Created Request
    // -------------------------------------------------------------
    console.log('\n--- STEP 16: AI Copilot Context Awareness ---');
    const aiChatRes = await apiRequest('/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        message: `What is the current status of application ${createdRequestNumber}?`,
        conversationHistory: [],
      },
    });
    assert(aiChatRes.status === 200 && aiChatRes.data.data.reply, 'AI Agent replied to status query');
    const replyText = aiChatRes.data.data.reply;
    assert(replyText.includes(createdRequestNumber), `AI accurately referenced request number ${createdRequestNumber}`);
    assert(replyText.includes(approvedStage.name) || replyText.includes('Approved') || replyText.includes(pipelineName), `AI response is grounded in real metadata: "${replyText.slice(0, 120)}..."`);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`   TEST RESULTS: ${passed} / ${total} ASSERTIONS PASSED`);
    console.log('=============================================================\n');

    if (passed === total) {
      console.log('🎉 ALL 16 STEPS OF THE CAMPUSFLOW GOLDEN LIFECYCLE PASSED SUCCESSFULLY!\n');
    }

  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN PHASE: Clean up test records
    // -------------------------------------------------------------
    console.log('\n--- TEARDOWN: Programmatic Fixture Cleanup ---');
    try {
      if (createdRequestId) {
        await supabaseAdmin.from('notifications').delete().eq('entity_id', createdRequestId);
        await supabaseAdmin.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabaseAdmin.from('conversations').delete().eq('request_id', createdRequestId);
        await supabaseAdmin.from('request_status_history').delete().eq('request_id', createdRequestId);
        await supabaseAdmin.from('requests').delete().eq('id', createdRequestId);
      }
      if (testWorkflow?.id) {
        await supabaseAdmin.from('workflow_executions').delete().eq('workflow_id', testWorkflow.id);
        await supabaseAdmin.from('workflows').delete().eq('id', testWorkflow.id);
      }
      if (pipelineId) {
        await supabaseAdmin.from('custom_fields').delete().eq('pipeline_id', pipelineId);
        await supabaseAdmin.from('pipeline_stages').delete().eq('pipeline_id', pipelineId);
        await supabaseAdmin.from('pipelines').delete().eq('id', pipelineId);
      }
      if (studentUser?.id) {
        await supabaseAdmin.from('user_roles').delete().eq('user_id', studentUser.id);
        await supabaseAdmin.from('users').delete().eq('id', studentUser.id);
      }
      if (officerUser?.id) {
        await supabaseAdmin.from('user_roles').delete().eq('user_id', officerUser.id);
        await supabaseAdmin.from('users').delete().eq('id', officerUser.id);
      }
      console.log('  Cleaned up all temporary test records successfully.');
    } catch (cleanupErr) {
      console.warn('  Teardown error (non-fatal):', cleanupErr.message);
    }
  }
}

runTest();
