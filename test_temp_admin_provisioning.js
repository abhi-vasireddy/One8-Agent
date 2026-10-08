/**
 * CAMPUSFLOW AI — TEMPORARY SUPER ADMIN & USER PROVISIONING TEST SUITE
 * 
 * Verifies:
 * 1. Temporary Super Admin Bootstrap Login (from server environment variables)
 * 2. Super Admin Creates Real Student User -> Student Logs in -> Redirects to Student Agent (/agent)
 * 3. Super Admin Creates Real Admission Officer -> Officer Logs in -> Redirects to Management Agent (/board)
 * 4. Super Admin Creates Real Dean -> Dean Logs in -> Redirects to Management Agent (/board)
 * 5. Direct URL / Backend API Protection (Student/Officer/Dean blocked with 403 on /api/admin/users)
 * 6. Super Admin Full Access on /api/admin/users (200 OK)
 * 7. Inactive User Rejection (HTTP 403)
 * 8. Generic Login Error (No email enumeration)
 * 9. Password Confidentiality (Never exposed in frontend responses)
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

let tempAdminToken = '';
let createdStudentToken = '';
let createdOfficerToken = '';
let createdDeanToken = '';

let createdStudentId = '';
let createdOfficerId = '';
let createdDeanId = '';

const studentEmail = `student.real.${Date.now()}@campusflow.edu`;
const officerEmail = `officer.real.${Date.now()}@campusflow.edu`;
const deanEmail = `dean.real.${Date.now()}@campusflow.edu`;

async function runProvisioningTests() {
  console.log('\n=============================================================');
  console.log('   CAMPUSFLOW AI — TEMP ADMIN & USER PROVISIONING TEST SUITE   ');
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
    // TEST 1: Temporary Super Admin Login from Environment
    // -------------------------------------------------------------
    console.log('--- TEST 1: Temporary Super Admin Bootstrap Login ---');
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@campusflow.local',
        password: 'CampusFlow@Admin2026!',
      },
    });

    assert(adminLogin.status === 200 && adminLogin.data.data?.token, 'Temporary Super Admin logged in via server-side env credentials');
    tempAdminToken = adminLogin.data.data.token;
    assert(adminLogin.data.data.access.portals.includes('admin_portal'), 'Bootstrap Super Admin granted "admin_portal" access');
    assert(adminLogin.data.data.access.defaultPortal === 'admin_portal', 'Default portal resolved to "admin_portal"');
    assert(adminLogin.data.data.access.redirectPath === '/admin', `Redirect path calculated to: "${adminLogin.data.data.access.redirectPath}"`);
    assert(!adminLogin.data.data.user.password && !JSON.stringify(adminLogin.data).includes('CampusFlow@Admin2026!'), 'Password is never exposed in response');

    // -------------------------------------------------------------
    // TEST 2: Super Admin Provisions Real Student User
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Super Admin Creates Real Student ---');
    const createStudentRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempAdminToken}` },
      body: {
        name: 'Priya Sharma (Admitted Student)',
        email: studentEmail,
        password: 'StudentSecure@2026',
        roleName: 'Student',
        branchId: null,
        departmentId: null,
        isActive: true,
      },
    });

    assert(createStudentRes.status === 201 && createStudentRes.data.data?.id, `Super Admin created Student account: ${studentEmail}`);
    createdStudentId = createStudentRes.data.data.id;
    assert(createStudentRes.data.data.roles.some(r => r.name === 'Student'), 'Student role automatically mapped');
    assert(createStudentRes.data.data.portals.includes('student_agent'), 'Student portal computed as "student_agent"');
    assert(createStudentRes.data.data.redirectPath === '/agent', 'Student redirect computed as /agent');

    // Student logs in on the normal login page with their credentials
    const studentLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: 'StudentSecure@2026',
      },
    });

    assert(studentLogin.status === 200 && studentLogin.data.data?.token, 'Created Student authenticated successfully');
    createdStudentToken = studentLogin.data.data.token;
    assert(studentLogin.data.data.access.defaultPortal === 'student_agent', 'Student default portal is "student_agent"');
    assert(studentLogin.data.data.access.redirectPath === '/agent', 'Student redirected to Student Agent (/agent)');

    // -------------------------------------------------------------
    // TEST 3: Super Admin Provisions Admission Officer
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Super Admin Creates Real Admission Officer ---');
    const createOfficerRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempAdminToken}` },
      body: {
        name: 'Officer Rajesh Kumar',
        email: officerEmail,
        password: 'OfficerSecure@2026',
        roleName: 'Admission Officer',
        isActive: true,
      },
    });

    assert(createOfficerRes.status === 201 && createOfficerRes.data.data?.id, `Super Admin created Officer account: ${officerEmail}`);
    createdOfficerId = createOfficerRes.data.data.id;
    assert(createOfficerRes.data.data.portals.includes('management_agent'), 'Officer portal computed as "management_agent"');

    // Officer logs in
    const officerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: officerEmail,
        password: 'OfficerSecure@2026',
      },
    });

    assert(officerLogin.status === 200 && officerLogin.data.data?.token, 'Created Officer authenticated successfully');
    createdOfficerToken = officerLogin.data.data.token;
    assert(officerLogin.data.data.access.defaultPortal === 'management_agent', 'Officer default portal is "management_agent"');
    assert(officerLogin.data.data.access.redirectPath === '/board', 'Officer redirected to Management Agent (/board)');

    // -------------------------------------------------------------
    // TEST 4: Super Admin Provisions Dean
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Super Admin Creates Real Dean ---');
    const createDeanRes = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempAdminToken}` },
      body: {
        name: 'Dean Robert Langdon',
        email: deanEmail,
        password: 'DeanSecure@2026',
        roleName: 'Dean',
        isActive: true,
      },
    });

    assert(createDeanRes.status === 201 && createDeanRes.data.data?.id, `Super Admin created Dean account: ${deanEmail}`);
    createdDeanId = createDeanRes.data.data.id;

    // Dean logs in
    const deanLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: deanEmail,
        password: 'DeanSecure@2026',
      },
    });

    assert(deanLogin.status === 200 && deanLogin.data.data?.token, 'Created Dean authenticated successfully');
    createdDeanToken = deanLogin.data.data.token;
    assert(deanLogin.data.data.access.defaultPortal === 'management_agent', 'Dean default portal is "management_agent"');
    assert(deanLogin.data.data.access.redirectPath === '/board', 'Dean redirected to Management Agent (/board)');

    // -------------------------------------------------------------
    // TEST 5: Backend Admin API Protection & Direct URL Bypass Block
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Backend Admin API Protection ---');
    
    // 5A. Student attempts GET /api/admin/users
    const studentAdminGet = await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${createdStudentToken}` },
    });
    assert(studentAdminGet.status === 403, `Student access to /api/admin/users rejected with HTTP 403`);

    // 5B. Student attempts POST /api/admin/users
    const studentAdminPost = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${createdStudentToken}` },
      body: { name: 'Unauthorized', email: 'unauth@test.com' },
    });
    assert(studentAdminPost.status === 403, `Student POST /api/admin/users rejected with HTTP 403`);

    // 5C. Admission Officer attempts POST /api/admin/users
    const officerAdminPost = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${createdOfficerToken}` },
      body: { name: 'Unauthorized Officer Action', email: 'unauth_officer@test.com' },
    });
    assert(officerAdminPost.status === 403, `Admission Officer POST /api/admin/users rejected with HTTP 403`);

    // 5D. Dean attempts POST /api/admin/users
    const deanAdminPost = await apiRequest('/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${createdDeanToken}` },
      body: { name: 'Unauthorized Dean Action', email: 'unauth_dean@test.com' },
    });
    assert(deanAdminPost.status === 403, `Dean POST /api/admin/users rejected with HTTP 403`);

    // 5E. Super Admin GET /api/admin/users
    const adminGetUsers = await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${tempAdminToken}` },
    });
    assert(adminGetUsers.status === 200 && Array.isArray(adminGetUsers.data.data), `Super Admin authorized on /api/admin/users (found ${adminGetUsers.data.data.length} users)`);

    // -------------------------------------------------------------
    // TEST 6: Inactive User Rejection (HTTP 403)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: User Status Toggling & Inactive Enforcement ---');
    
    // Deactivate student
    const deactRes = await apiRequest(`/admin/users/${createdStudentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tempAdminToken}` },
      body: { isActive: false },
    });
    assert(deactRes.status === 200 && deactRes.data.data.is_active === false, 'Super Admin deactivated Student account');

    // Inactive Student attempts login
    const deactLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: 'StudentSecure@2026',
      },
    });
    assert(deactLogin.status === 403, `Deactivated user rejected with HTTP 403: "${deactLogin.data.message}"`);

    // Reactivate student
    const reactRes = await apiRequest(`/admin/users/${createdStudentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tempAdminToken}` },
      body: { isActive: true },
    });
    assert(reactRes.status === 200 && reactRes.data.data.is_active === true, 'Super Admin re-activated Student account');

    // Reactivated Student logs in again
    const reactLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: studentEmail,
        password: 'StudentSecure@2026',
      },
    });
    assert(reactLogin.status === 200, 'Re-activated Student successfully logged in');

    // -------------------------------------------------------------
    // TEST 7: Generic Login Error (No Account Enumeration)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Generic Login Error Handling ---');
    const badEmailLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent.user.999@campusflow.edu', password: 'randompassword' },
    });
    assert(badEmailLogin.status === 401 && badEmailLogin.data.message === 'Invalid email or password', 'Non-existent email returns generic "Invalid email or password"');

    const badPasswordLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: studentEmail, password: 'wrongpassword' },
    });
    assert(badPasswordLogin.status === 401 && badPasswordLogin.data.message === 'Invalid email or password', 'Valid email with wrong password returns identical generic message');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n--- Cleaning up temporary test accounts ---');
    await supabaseAdmin.from('users').delete().in('id', [createdStudentId, createdOfficerId, createdDeanId]);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`   TESTS COMPLETED: ${passed} / ${total} PASSED`);
    console.log('=============================================================\n');

    if (passed === total) {
      console.log('🎉 ALL PROVISIONING, TEMP ADMIN, RBAC, AND SECURITY TESTS PASSED!\n');
    }

  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  }
}

runProvisioningTests();
