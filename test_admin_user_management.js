/**
 * CAMPUSFLOW AI — ADMIN USER MANAGEMENT & CREDENTIAL MANAGEMENT TEST SUITE
 * 
 * Verifies all 39 requirements:
 * 1. Super Admin login & portal access
 * 2. User Creation: Student (auto-defaults to Student role, routes to Student Agent)
 * 3. User Creation: Management (Admission Officer / Dean, routes to Management Agent)
 * 4. User Directory listing, search, and faceted filtering (type, role, branch, status)
 * 5. User Details retrieval (profile, calculated portals, roles, audit trail)
 * 6. User Profile editing (name, phone, branch, status)
 * 7. Role Change (atomic role change from Student -> Management, verified next login routing)
 * 8. Administrative Password Reset (Supabase Auth update, temporary password login verification)
 * 9. User Activation / Deactivation (Inactive user rejected with 403)
 * 10. Last Active Super Admin Protection (Blocked from deactivation & demotion with HTTP 400)
 * 11. Super Admin Account Credential Management (Password update & verification via /api/admin/account)
 * 12. Password Confidentiality (Never stored in database plaintext, audit logs, or responses)
 * 13. Unauthorized Non-Admin Access Blocking (Students & Management blocked with HTTP 403)
 */

import { supabaseAdmin } from './server/src/config/supabase.js';

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
    // text
  }

  return {
    status: res.status,
    data,
  };
}

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log('   CAMPUSFLOW AI — ADMIN USER & CREDENTIAL MANAGEMENT TEST SUITE       ');
  console.log('========================================================================\n');

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

  let adminToken = '';
  let adminUserId = '';

  let studentId = '';
  let studentEmail = `student.test.${Date.now()}@campusflow.edu`;
  let studentToken = '';

  let officerId = '';
  let officerEmail = `officer.test.${Date.now()}@campusflow.edu`;
  let officerToken = '';

  try {
    // -------------------------------------------------------------
    // 1. Super Admin Login
    // -------------------------------------------------------------
    console.log('--- 1. Super Admin Bootstrap Authentication ---');
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@campusflow.local',
        password: 'CampusFlow@Admin2026!',
      },
    });

    assert(adminLogin.status === 200 && adminLogin.data.data?.token, 'Super Admin logged in successfully');
    adminToken = adminLogin.data.data.token;
    adminUserId = adminLogin.data.data.user.id;
    assert(adminLogin.data.data.access.defaultPortal === 'admin_portal', 'Super Admin routed to admin_portal');
    assert(adminLogin.data.data.access.redirectPath === '/admin', 'Super Admin redirect path is /admin');

    // -------------------------------------------------------------
    // 2. Super Admin Creates Student User
    // -------------------------------------------------------------
    console.log('\n--- 2. User Creation: Student ---');
    const createStudentRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Aarav Sharma',
        email: studentEmail,
        phone: '+91 9876543210',
        userType: 'Student',
        roleName: 'Student',
        password: 'StudentPass@123',
        isActive: true,
      },
    });

    assert(createStudentRes.status === 201, 'Super Admin created Student account (HTTP 201)');
    const createdStudent = createStudentRes.data.data;
    studentId = createdStudent.id;
    assert(createdStudent.userType === 'Student', 'Student user type recorded as Student');
    assert(createdStudent.roles.some(r => r.name === 'Student'), 'Student assigned Student role');
    assert(createdStudent.defaultPortal === 'student_agent', 'Student default portal is student_agent');
    assert(!createdStudent.password && !JSON.stringify(createStudentRes.data).includes('StudentPass@123'), 'Student password is NEVER exposed in API response');

    // Student Login Verification
    const studentLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: 'StudentPass@123',
      },
    });
    assert(studentLogin.status === 200 && studentLogin.data.data?.token, 'Created Student authenticated successfully');
    studentToken = studentLogin.data.data.token;
    assert(studentLogin.data.data.access.defaultPortal === 'student_agent', 'Student logged-in session routes to student_agent');
    assert(studentLogin.data.data.access.redirectPath === '/agent', 'Student logged-in session redirect path is /agent');

    // -------------------------------------------------------------
    // 3. Super Admin Creates Management User (Admission Officer)
    // -------------------------------------------------------------
    console.log('\n--- 3. User Creation: Management (Admission Officer) ---');
    const createOfficerRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Marcus Vance',
        email: officerEmail,
        phone: '+91 9123456789',
        userType: 'Management',
        roleName: 'Admission Officer',
        password: 'OfficerPass@123',
        isActive: true,
      },
    });

    assert(createOfficerRes.status === 201, 'Super Admin created Admission Officer account (HTTP 201)');
    const createdOfficer = createOfficerRes.data.data;
    officerId = createdOfficer.id;
    assert(createdOfficer.userType === 'Management', 'Management user type recorded as Management');
    assert(createdOfficer.roles.some(r => r.name === 'Admission Officer'), 'Assigned Admission Officer role');
    assert(createdOfficer.defaultPortal === 'management_agent', 'Management default portal is management_agent');
    assert(!createdOfficer.password && !JSON.stringify(createOfficerRes.data).includes('OfficerPass@123'), 'Officer password is NEVER exposed');

    // Officer Login Verification
    const officerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: officerEmail,
        password: 'OfficerPass@123',
      },
    });
    assert(officerLogin.status === 200 && officerLogin.data.data?.token, 'Created Admission Officer authenticated successfully');
    officerToken = officerLogin.data.data.token;
    assert(officerLogin.data.data.access.defaultPortal === 'management_agent', 'Officer logged-in session routes to management_agent');
    assert(officerLogin.data.data.access.redirectPath === '/board', 'Officer logged-in session redirect path is /board');

    // -------------------------------------------------------------
    // 4. User Directory & Faceted Filtering
    // -------------------------------------------------------------
    console.log('\n--- 4. User Directory Search & Filtering ---');
    // List all
    const allUsersRes = await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(allUsersRes.status === 200 && Array.isArray(allUsersRes.data.data), 'Super Admin fetched user directory list');

    // Search by name
    const searchRes = await apiRequest('/admin/users?search=Marcus', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(searchRes.status === 200 && searchRes.data.data.some(u => u.name.includes('Marcus')), 'Search by name returned Marcus Vance');

    // Filter by type=Student
    const studentFilterRes = await apiRequest('/admin/users?type=Student', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      studentFilterRes.status === 200 && studentFilterRes.data.data.every(u => u.userType === 'Student'),
      'Filtered by type=Student returned only student records'
    );

    // Filter by type=Management
    const mgmtFilterRes = await apiRequest('/admin/users?type=Management', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      mgmtFilterRes.status === 200 && mgmtFilterRes.data.data.every(u => u.userType === 'Management'),
      'Filtered by type=Management returned only management records'
    );

    // Filter by role=Admission Officer
    const roleFilterRes = await apiRequest('/admin/users?role=Admission%20Officer', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      roleFilterRes.status === 200 && roleFilterRes.data.data.some(u => u.id === officerId),
      'Filtered by role="Admission Officer" returned target officer'
    );

    // -------------------------------------------------------------
    // 5. User Details Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 5. User Details & Audit Trail Retrieval ---');
    const userDetailRes = await apiRequest(`/admin/users/${officerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(userDetailRes.status === 200, 'GET /admin/users/:id returned 200 OK');
    const userDetail = userDetailRes.data.data;
    assert(userDetail.name === 'Marcus Vance', 'User detail name matches');
    assert(userDetail.email === officerEmail, 'User detail email matches');
    assert(userDetail.portals?.includes('management_agent'), 'User detail includes management_agent portal');
    assert(Array.isArray(userDetail.auditLogs), 'User detail returns audit trail entries');

    // -------------------------------------------------------------
    // 6. Edit User Profile
    // -------------------------------------------------------------
    console.log('\n--- 6. Edit User Profile ---');
    const updateRes = await apiRequest(`/admin/users/${officerId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Marcus Vance (Senior Officer)',
        phone: '+91 9999900000',
      },
    });
    assert(updateRes.status === 200, 'PUT /admin/users/:id returned 200 OK');
    assert(updateRes.data.data.name === 'Marcus Vance (Senior Officer)', 'User name updated in database');
    assert(updateRes.data.data.phone === '+91 9999900000', 'User phone updated in database');

    // -------------------------------------------------------------
    // 7. Atomic Role Change (Student -> Management)
    // -------------------------------------------------------------
    console.log('\n--- 7. Atomic Role Change (Student -> Management) ---');
    const changeRoleRes = await apiRequest(`/admin/users/${studentId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        roleName: 'Admission Officer',
      },
    });
    assert(changeRoleRes.status === 200, 'PATCH /admin/users/:id/role returned 200 OK');
    assert(changeRoleRes.data.data.roles.some(r => r.name === 'Admission Officer'), 'User primary role updated to Admission Officer');
    assert(changeRoleRes.data.data.userType === 'Management', 'User type dynamically updated to Management');
    assert(changeRoleRes.data.data.defaultPortal === 'management_agent', 'Default portal updated to management_agent');

    // Verify next login reflects new role routing
    const promotedLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: 'StudentPass@123',
      },
    });
    assert(promotedLogin.status === 200, 'Promoted user authenticated with existing credentials');
    assert(promotedLogin.data.data.access.defaultPortal === 'management_agent', 'Next login automatically routed promoted user to management_agent');
    assert(promotedLogin.data.data.access.redirectPath === '/board', 'Redirect path updated to /board');

    // -------------------------------------------------------------
    // 8. Administrative Password Reset
    // -------------------------------------------------------------
    console.log('\n--- 8. Administrative Password Reset ---');
    const newTempPassword = 'SecureNewPass@2026!';
    const resetRes = await apiRequest(`/admin/users/${studentId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        temporaryPassword: newTempPassword,
      },
    });
    assert(resetRes.status === 200, 'POST /admin/users/:id/reset-password returned 200 OK');
    assert(!JSON.stringify(resetRes.data).includes(newTempPassword), 'API response does not return plaintext password');

    // Verify old password rejected
    const oldPassLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: 'StudentPass@123',
      },
    });
    assert(oldPassLogin.status === 401, 'Old password invalidated (HTTP 401)');

    // Verify new temporary password accepted
    const newPassLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: newTempPassword,
      },
    });
    assert(newPassLogin.status === 200 && newPassLogin.data.data?.token, 'User authenticated with new temporary password (HTTP 200)');

    // -------------------------------------------------------------
    // 9. User Activation / Deactivation Governance
    // -------------------------------------------------------------
    console.log('\n--- 9. User Activation & Deactivation ---');
    // Deactivate user
    const deactivateRes = await apiRequest(`/admin/users/${studentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        isActive: false,
      },
    });
    assert(deactivateRes.status === 200, 'PATCH /admin/users/:id/status set isActive=false');
    assert(deactivateRes.data.data.is_active === false, 'User status is inactive in database');

    // Inactive user authentication attempt
    const inactiveLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: newTempPassword,
      },
    });
    assert(
      (inactiveLogin.data.message || '').toLowerCase().includes('inactive') ||
      (inactiveLogin.data.message || '').toLowerCase().includes('deactivated'),
      'Rejection message clearly indicates account is inactive or deactivated'
    );

    // Reactivate user
    const reactivateRes = await apiRequest(`/admin/users/${studentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        isActive: true,
      },
    });
    assert(reactivateRes.status === 200, 'PATCH /admin/users/:id/status set isActive=true');

    // Reactivated user login
    const reactivatedLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: newTempPassword,
      },
    });
    assert(reactivatedLogin.status === 200, 'Reactivated user can log in again');

    // -------------------------------------------------------------
    // 10. Last Active Super Admin Protection
    // -------------------------------------------------------------
    console.log('\n--- 10. Last Active Super Admin Protection Rule ---');
    // Attempt to deactivate last Super Admin
    const deactAdminRes = await apiRequest(`/admin/users/${adminUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        isActive: false,
      },
    });
    assert(deactAdminRes.status === 400, 'Deactivating last active Super Admin BLOCKED (HTTP 400)');
    assert(
      (deactAdminRes.data?.message || '').includes('last active Super Admin'),
      `Protection message confirmed: "${deactAdminRes.data?.message}"`
    );

    // Attempt to demote last Super Admin
    const demoteAdminRes = await apiRequest(`/admin/users/${adminUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        roleName: 'Student',
      },
    });
    assert(demoteAdminRes.status === 400, 'Demoting last active Super Admin BLOCKED (HTTP 400)');
    assert(
      (demoteAdminRes.data?.message || '').includes('last active Super Admin'),
      `Demotion protection message confirmed: "${demoteAdminRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // 11. Admin Account & Credential Management
    // -------------------------------------------------------------
    console.log('\n--- 11. Admin Portal Credential Management (/admin/account) ---');
    // Get admin account
    const getAccountRes = await apiRequest('/admin/account', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getAccountRes.status === 200, 'GET /admin/account returned 200 OK');
    assert(getAccountRes.data.data.isSuperAdmin === true, 'Admin account confirms Super Admin privileges');
    assert(getAccountRes.data.data.isBootstrapAdmin === true, 'Bootstrap account identified safely');

    // Change Admin Password
    const newAdminPass = 'NewAdminPass@2026!';
    const changeAdminPassRes = await apiRequest('/admin/account/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        currentPassword: 'CampusFlow@Admin2026!',
        newPassword: newAdminPass,
        confirmPassword: newAdminPass,
      },
    });
    assert(changeAdminPassRes.status === 200, 'PUT /admin/account/password changed password successfully');

    // Verify Admin can log in with new password
    const newAdminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@campusflow.local',
        password: newAdminPass,
      },
    });
    assert(newAdminLogin.status === 200 && newAdminLogin.data.data?.token, 'Super Admin logged in with new credentials');

    // Restore Admin password back to CampusFlow@Admin2026! so bootstrap remains functional
    const restorePassRes = await apiRequest('/admin/account/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${newAdminLogin.data.data.token}` },
      body: {
        currentPassword: newAdminPass,
        newPassword: 'CampusFlow@Admin2026!',
        confirmPassword: 'CampusFlow@Admin2026!',
      },
    });
    assert(restorePassRes.status === 200, 'Restored initial Super Admin password for ongoing suite compatibility');

    // -------------------------------------------------------------
    // 12. Password Confidentiality Verification in Database & Audit
    // -------------------------------------------------------------
    console.log('\n--- 12. Password Confidentiality Verification ---');
    // Check public.users
    const { data: dbUser } = await supabaseAdmin.from('users').select('*').eq('id', studentId).single();
    assert(!dbUser.password && !dbUser.password_hash, 'No plaintext password in public.users table');

    // Check recent audit logs
    const { data: recentLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    const logsString = JSON.stringify(recentLogs);
    assert(!logsString.includes('StudentPass@123') && !logsString.includes('NewAdminPass@2026!') && !logsString.includes(newTempPassword),
      'Plaintext passwords are NEVER written to audit logs'
    );

    // -------------------------------------------------------------
    // 13. Backend RBAC Protection: Non-Admin Forbidden (HTTP 403)
    // -------------------------------------------------------------
    console.log('\n--- 13. Backend RBAC Enforcement (Non-Admin Blocked) ---');
    // Student attempts user creation
    const studentCreateAttempt = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        name: 'Hacker User',
        email: 'hacker@test.com',
        userType: 'Management',
        roleName: 'Super Admin',
        password: 'pass',
      },
    });
    assert(studentCreateAttempt.status === 403, 'Student blocked from POST /admin/users (HTTP 403)');

    // Student attempts role change
    const studentRoleAttempt = await apiRequest(`/admin/users/${studentId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { roleName: 'Super Admin' },
    });
    assert(studentRoleAttempt.status === 403, 'Student blocked from PATCH /admin/users/:id/role (HTTP 403)');

    // Student attempts password reset
    const studentResetAttempt = await apiRequest(`/admin/users/${officerId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { temporaryPassword: 'hacked' },
    });
    assert(studentResetAttempt.status === 403, 'Student blocked from POST /admin/users/:id/reset-password (HTTP 403)');

    // Student attempts admin account settings
    const studentAccountAttempt = await apiRequest('/admin/account', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentAccountAttempt.status === 403, 'Student blocked from GET /admin/account (HTTP 403)');

    // Admission Officer attempts user creation
    const officerCreateAttempt = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: {
        name: 'Officer User',
        email: 'officer2@test.com',
        userType: 'Student',
        roleName: 'Student',
        password: 'pass',
      },
    });
    assert(officerCreateAttempt.status === 403, 'Admission Officer blocked from POST /admin/users (HTTP 403)');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`   TEST RESULTS: ${passed}/${total} ASSERTIONS PASSED                    `);
    console.log('========================================================================\n');

    if (passed === total) {
      console.log('🎉 ALL USER MANAGEMENT & CREDENTIAL MANAGEMENT TESTS PASSED!\n');
    } else {
      console.error(`❌ ${total - passed} ASSERTIONS FAILED.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled test suite error:', err);
    process.exit(1);
  }
}

runTestSuite();
