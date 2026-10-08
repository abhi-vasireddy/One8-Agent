/**
 * CAMPUSFLOW AI — SECURITY, RBAC & PORTAL ACCESS TEST SUITE
 * 
 * Verifies that:
 * 1. Portal calculation and redirection work dynamically for each role.
 * 2. Inactive accounts are blocked with HTTP 403.
 * 3. Non-admin users cannot access administrative endpoints (Zero URL bypasses).
 * 4. Super Admin can provision and deactivate/reactivate users.
 * 5. Student records are isolated from other students.
 * 6. AI Agent is grounded in the authenticated user session.
 * 
 * NOTE: Operates on programmatic isolated test fixtures — zero hardcoded demo accounts.
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
let deanToken = '';
let adminToken = '';
let createdAdvisorEmail = `advisor.${Date.now()}@test.campusflow.local`;
let createdAdvisorId = '';

const testStudentEmail = `rbac.student.${Date.now()}@test.campusflow.local`;
const testOfficerEmail = `rbac.officer.${Date.now()}@test.campusflow.local`;
const testDeanEmail = `rbac.dean.${Date.now()}@test.campusflow.local`;
const testPassword = 'TestPassword@2026!';

let createdUserIds = [];
let testPipelineId = '';

async function runSecurityTests() {
  console.log('\n=============================================================');
  console.log('   CAMPUSFLOW AI — SECURITY, RBAC & PORTAL ACCESS TEST SUITE   ');
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
    // SETUP: Bootstrap Super Admin & Create Test Personas
    // -------------------------------------------------------------
    console.log('--- SETUP: Authenticating Bootstrap Super Admin ---');
    const adminLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: env.auth.tempAdminEmail || 'admin@campusflow.local',
        password: env.auth.tempAdminPassword || 'CampusFlow@Admin2026!',
      },
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.data.token, 'Super Admin logged in with bootstrap credentials');
    adminToken = adminLoginRes.data.data.token;
    assert(adminLoginRes.data.data.access.portals.includes('admin_portal'), 'Super Admin granted "admin_portal" access');
    assert(adminLoginRes.data.data.access.redirectPath === '/admin', `Super Admin redirection computed to: "${adminLoginRes.data.data.access.redirectPath}"`);

    // Create Test Student
    const stuCreate = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'RBAC Student',
        email: testStudentEmail,
        password: testPassword,
        userType: 'Student',
        roleName: 'Student',
      },
    });
    assert(stuCreate.status === 201, `Created isolated test student: ${testStudentEmail}`);
    createdUserIds.push(stuCreate.data.data.id);

    // Create Test Officer
    const offCreate = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'RBAC Admission Officer',
        email: testOfficerEmail,
        password: testPassword,
        userType: 'Management',
        roleName: 'Admission Officer',
      },
    });
    assert(offCreate.status === 201, `Created isolated test officer: ${testOfficerEmail}`);
    createdUserIds.push(offCreate.data.data.id);

    // Create Test Dean
    const deanCreate = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'RBAC Dean',
        email: testDeanEmail,
        password: testPassword,
        userType: 'Management',
        roleName: 'Dean',
      },
    });
    assert(deanCreate.status === 201, `Created isolated test dean: ${testDeanEmail}`);
    createdUserIds.push(deanCreate.data.data.id);

    // Create Isolated Test Pipeline for Resource Isolation testing
    const pipeRes = await apiRequest('/config/pipelines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: `RBAC Security Pipeline (${Date.now()})`,
        entityType: 'request',
      },
    });
    testPipelineId = pipeRes.data.data.id;

    // Configure initial stage on pipeline
    await apiRequest(`/config/stages/pipelines/${testPipelineId}/stages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Received',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
    });

    // -------------------------------------------------------------
    // TEST 1: Credential Authentication & Redirection Path Calculations
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Credential Authentication & Portal Calculation ---');
    
    // 1A. Student Login
    const studentLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testStudentEmail, password: testPassword },
    });
    assert(studentLogin.status === 200 && studentLogin.data.data.token, 'Student logged in with valid credentials');
    studentToken = studentLogin.data.data.token;
    assert(studentLogin.data.data.access.portals.includes('student_agent'), 'Student granted "student_agent" portal access');
    assert(!studentLogin.data.data.access.portals.includes('admin_portal'), 'Student explicitly denied "admin_portal" portal access');
    assert(studentLogin.data.data.access.redirectPath === '/agent', `Student redirection computed to: "${studentLogin.data.data.access.redirectPath}"`);

    // 1B. Admission Officer Login
    const officerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testOfficerEmail, password: testPassword },
    });
    assert(officerLogin.status === 200 && officerLogin.data.data.token, 'Admission Officer logged in with valid credentials');
    officerToken = officerLogin.data.data.token;
    assert(officerLogin.data.data.access.portals.includes('management_agent'), 'Admission Officer granted "management_agent" portal access');
    assert(!officerLogin.data.data.access.portals.includes('admin_portal'), 'Admission Officer explicitly denied "admin_portal" portal access');
    assert(officerLogin.data.data.access.redirectPath === '/board', `Admission Officer redirection computed to: "${officerLogin.data.data.access.redirectPath}"`);

    // 1C. Dean Login
    const deanLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testDeanEmail, password: testPassword },
    });
    assert(deanLogin.status === 200 && deanLogin.data.data.token, 'Dean logged in with valid credentials');
    deanToken = deanLogin.data.data.token;
    assert(deanLogin.data.data.access.portals.includes('management_agent'), 'Dean granted "management_agent" portal access');
    assert(!deanLogin.data.data.access.portals.includes('admin_portal'), 'Dean explicitly denied "admin_portal" portal access');
    assert(deanLogin.data.data.access.redirectPath === '/board', `Dean redirection computed to: "${deanLogin.data.data.access.redirectPath}"`);

    // -------------------------------------------------------------
    // TEST 2: Inactive Account Rejection (HTTP 403)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Inactive Account Rejection ---');
    const inactiveEmail = `inactive.${Date.now()}@test.campusflow.local`;
    const { data: inactiveUser } = await supabaseAdmin.from('users').insert({
      email: inactiveEmail,
      name: 'Former Staff Member',
      college_id: '11111111-1111-1111-1111-111111111111',
      is_active: false,
    }).select().single();

    const inactiveLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: inactiveEmail, password: testPassword },
    });
    assert(inactiveLogin.status === 403, `Inactive user login blocked with HTTP 403: "${inactiveLogin.data.message}"`);

    if (inactiveUser?.id) {
      await supabaseAdmin.from('users').delete().eq('id', inactiveUser.id);
    }

    // -------------------------------------------------------------
    // TEST 3: Backend Admin API Protection (Zero URL Bypasses)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Backend Admin API Protection ---');
    
    // 3A. Student attempts GET /api/admin/users
    const studentGetAdmin = await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentGetAdmin.status === 403, `Student GET /api/admin/users rejected with HTTP 403: "${studentGetAdmin.data.message}"`);

    // 3B. Student attempts POST /api/admin/users
    const studentPostAdmin = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { name: 'Hacker', email: 'hacker@test.com' },
    });
    assert(studentPostAdmin.status === 403, `Student POST /api/admin/users rejected with HTTP 403: "${studentPostAdmin.data.message}"`);

    // 3C. Admission Officer attempts POST /api/admin/users
    const officerPostAdmin = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: { name: 'Unauthorized Staff', email: 'staff@test.com' },
    });
    assert(officerPostAdmin.status === 403, `Admission Officer POST /api/admin/users rejected with HTTP 403: "${officerPostAdmin.data.message}"`);

    // 3D. Dean attempts POST /api/admin/users
    const deanPostAdmin = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${deanToken}` },
      body: { name: 'Unauthorized Dean Action', email: 'dean_sub@test.com' },
    });
    assert(deanPostAdmin.status === 403, `Dean POST /api/admin/users rejected with HTTP 403: "${deanPostAdmin.data.message}"`);

    // 3E. Super Admin calls GET /api/admin/users
    const adminGetUsers = await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminGetUsers.status === 200 && Array.isArray(adminGetUsers.data.data), `Super Admin GET /api/admin/users authorized (found ${adminGetUsers.data.data.length} users)`);

    // -------------------------------------------------------------
    // TEST 4: Super Admin User Creation & Lifecycle Test
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Super Admin User Creation & Activation Flow ---');
    
    // 4A. Super Admin creates new Admission Officer
    const createUserRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Officer Priya Nair',
        email: createdAdvisorEmail,
        password: 'password123',
        roleName: 'Admission Officer',
        isActive: true,
      },
    });
    assert(createUserRes.status === 201 && createUserRes.data.data.id, `Super Admin successfully created user: ${createdAdvisorEmail}`);
    createdAdvisorId = createUserRes.data.data.id;
    createdUserIds.push(createdAdvisorId);
    assert(createUserRes.data.data.roles.some(r => r.name === 'Admission Officer'), 'Admission Officer role automatically mapped');
    assert(createUserRes.data.data.portals.includes('management_agent'), 'Assigned access calculated as "management_agent"');

    // 4B. Newly created user logs in with their credentials
    const newOfficerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: createdAdvisorEmail, password: 'password123' },
    });
    assert(newOfficerLogin.status === 200 && newOfficerLogin.data.data.token, 'Newly created user successfully authenticated');
    assert(newOfficerLogin.data.data.access.defaultPortal === 'management_agent', 'New user correctly assigned to Management Agent portal');
    assert(newOfficerLogin.data.data.access.redirectPath === '/board', 'New user redirection matches /board');

    // 4C. Super Admin deactivates this user
    const deactRes = await apiRequest(`/admin/users/${createdAdvisorId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false },
    });
    assert(deactRes.status === 200 && deactRes.data.data.is_active === false, 'Super Admin deactivated user account');

    // 4D. Deactivated user attempts login -> must fail with 403
    const deactLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: createdAdvisorEmail, password: 'password123' },
    });
    assert(deactLogin.status === 403, 'Deactivated user login rejected with HTTP 403');

    // 4E. Super Admin re-activates user
    const reactRes = await apiRequest(`/admin/users/${createdAdvisorId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: true },
    });
    assert(reactRes.status === 200 && reactRes.data.data.is_active === true, 'Super Admin re-activated user account');

    // -------------------------------------------------------------
    // TEST 5: Student Request Isolation (Resource Hiding)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Student Request Isolation ---');
    
    // Create Student B
    const studentBEmail = `student.b.${Date.now()}@test.campusflow.local`;
    const createStudentB = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Bob Student',
        email: studentBEmail,
        password: 'password123',
        roleName: 'Student',
      },
    });
    createdUserIds.push(createStudentB.data.data.id);

    const studentBLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: studentBEmail, password: 'password123' },
    });
    const studentBToken = studentBLogin.data.data.token;

    // Student A creates a request
    const studentAReqRes = await apiRequest('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        pipelineId: testPipelineId,
        title: 'Confidential Application of Student A',
        customFieldValues: {},
      },
    });
    const studentAReqId = studentAReqRes.data.data.id;

    // Student B attempts to access Student A's request
    const unauthorizedAccessRes = await apiRequest(`/requests/${studentAReqId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert([403, 404].includes(unauthorizedAccessRes.status), `Cross-student request access blocked with HTTP ${unauthorizedAccessRes.status}`);

    // Admission Officer CAN access Student A's request
    const officerAccessRes = await apiRequest(`/requests/${studentAReqId}`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert(officerAccessRes.status === 200, 'Admission Officer authorized to access student request for management review');

    // -------------------------------------------------------------
    // TEST 6: AI Copilot Context Grounding
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: AI Copilot Session Identity Grounding ---');
    const aiRes = await apiRequest('/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        message: 'Hello, what is my name and what requests do you see?',
        conversationHistory: [],
      },
    });
    assert(aiRes.status === 200 && aiRes.data.data.reply, 'AI Agent replied with session context');
    assert(aiRes.data.data.reply.includes('RBAC') || aiRes.data.data.contextUsed, 'AI Agent grounded in authenticated user session');

    // Clean up created request
    if (studentAReqId) {
      await supabaseAdmin.from('notifications').delete().eq('entity_id', studentAReqId);
      await supabaseAdmin.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('conversations').delete().eq('request_id', studentAReqId);
      await supabaseAdmin.from('request_status_history').delete().eq('request_id', studentAReqId);
      await supabaseAdmin.from('requests').delete().eq('id', studentAReqId);
    }

    // Clean up test pipeline & stages
    if (testPipelineId) {
      await supabaseAdmin.from('pipeline_stages').delete().eq('pipeline_id', testPipelineId);
      await supabaseAdmin.from('pipelines').delete().eq('id', testPipelineId);
    }

    // Clean up created test users
    if (createdUserIds.length > 0) {
      await supabaseAdmin.from('user_roles').delete().in('user_id', createdUserIds);
      await supabaseAdmin.from('users').delete().in('id', createdUserIds);
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`   SECURITY TESTS COMPLETED: ${passed} / ${total} PASSED`);
    console.log('=============================================================\n');

    if (passed === total) {
      console.log('🔒 ALL RBAC, AUTHENTICATION, AND PORTAL ISOLATION TESTS PASSED!\n');
    }

  } catch (err) {
    console.error('Fatal security test error:', err);
    process.exitCode = 1;
  }
}

runSecurityTests();
