import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const client = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const runSupabaseSeed = async () => {
  console.log('--- Initializing CampusFlow Institutional Baseline Configuration ---');

  // 1. College
  console.log('1. Configuring College...');
  const { error: colErr } = await client.from('colleges').upsert({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Apex Institute of Technology & Management',
    code: 'APEX-TECH',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=200&auto=format&fit=crop&q=60',
    settings: {
      theme: 'dark',
      timezone: 'Asia/Kolkata',
      academic_year: '2026-2027',
      features: { ai_agent: true, workflows: true, sla_tracking: true },
    },
  }, { onConflict: 'id' });
  if (colErr) console.error('College error:', colErr.message);

  // 2. Campus
  console.log('2. Configuring Campus...');
  const { error: camErr } = await client.from('campuses').upsert({
    id: '22222222-2222-2222-2222-222222222222',
    college_id: '11111111-1111-1111-1111-111111111111',
    name: 'North Valley Main Campus',
    code: 'CAMPUS-MAIN',
    address: 'Academic Boulevard, Sector 4, Silicon Valley Corridor',
    settings: { capacity: 15000, is_main: true },
    is_active: true,
  }, { onConflict: 'id' });
  if (camErr) console.error('Campus error:', camErr.message);

  // 3. Branches
  console.log('3. Configuring Branches...');
  const { error: brErr } = await client.from('branches').upsert([
    {
      id: '33333333-3333-3333-3333-333333333331',
      college_id: '11111111-1111-1111-1111-111111111111',
      campus_id: '22222222-2222-2222-2222-222222222222',
      name: 'School of Computer Science & Engineering',
      code: 'ENG-CSE',
      description: 'Undergraduate and Postgraduate programs in AI, Software Systems, and Cybersecurity',
      is_active: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      college_id: '11111111-1111-1111-1111-111111111111',
      campus_id: '22222222-2222-2222-2222-222222222222',
      name: 'School of Business & Management',
      code: 'MGMT-MBA',
      description: 'Global MBA, FinTech, and Executive Leadership programs',
      is_active: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      college_id: '11111111-1111-1111-1111-111111111111',
      campus_id: '22222222-2222-2222-2222-222222222222',
      name: 'School of Applied Sciences',
      code: 'SCI-APP',
      description: 'Data Science, Physics, and Nanotechnology departments',
      is_active: true,
    },
  ], { onConflict: 'id' });
  if (brErr) console.error('Branches error:', brErr.message);

  // 4. Departments
  console.log('4. Configuring Departments...');
  const { error: deptErr } = await client.from('departments').upsert([
    {
      id: '44444444-4444-4444-4444-444444444441',
      college_id: '11111111-1111-1111-1111-111111111111',
      branch_id: '33333333-3333-3333-3333-333333333331',
      name: 'Department of Artificial Intelligence & ML',
      code: 'DEPT-AIML',
      description: 'AI lab facilities, neural computing, robotics research',
      is_active: true,
    },
    {
      id: '44444444-4444-4444-4444-444444444442',
      college_id: '11111111-1111-1111-1111-111111111111',
      branch_id: '33333333-3333-3333-3333-333333333331',
      name: 'Department of Software Engineering',
      code: 'DEPT-SWE',
      description: 'Cloud systems, web architectures, distributed systems',
      is_active: true,
    },
  ], { onConflict: 'id' });
  if (deptErr) console.error('Departments error:', deptErr.message);

  // 5. System Roles
  console.log('5. Configuring System Roles...');
  const { error: roleErr } = await client.from('roles').upsert([
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      college_id: '11111111-1111-1111-1111-111111111111',
      name: 'Super Admin',
      description: 'Full institutional control over workflows, configurations, roles, pipelines, and audit logs',
      is_system: true,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
      college_id: '11111111-1111-1111-1111-111111111111',
      name: 'Dean',
      description: 'Institutional review, high-level approvals, SLA monitoring across school branches',
      is_system: false,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
      college_id: '11111111-1111-1111-1111-111111111111',
      name: 'Head of Department (HOD)',
      description: 'Departmental request approvals, stage progression, student issue redressal',
      is_system: false,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
      college_id: '11111111-1111-1111-1111-111111111111',
      name: 'Admission Officer',
      description: 'Manages candidate application review, verification, triage, and admissions stage movements',
      is_system: false,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
      college_id: '11111111-1111-1111-1111-111111111111',
      name: 'Faculty',
      description: 'Academic evaluations, student advisement, curriculum-based review actions',
      is_system: false,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
      college_id: '11111111-1111-1111-1111-111111111111',
      name: 'Student',
      description: 'Submits requests, fills forms, tracks status, interacts with AI assistant',
      is_system: true,
    },
  ], { onConflict: 'id' });
  if (roleErr) console.error('Roles error:', roleErr.message);

  // 6. Role Permissions
  console.log('6. Configuring Role Permissions...');
  const { error: permErr } = await client.from('permissions').upsert([
    {
      role_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      resource_type: 'all',
      actions: { view: true, create: true, edit: true, delete: true, assign: true, approve: true },
      conditions: {},
    },
    {
      role_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
      resource_type: 'pipeline',
      actions: { view: true, create: false, edit: true, delete: false, assign: true, approve: true },
      conditions: {},
    },
    {
      role_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
      resource_type: 'request',
      actions: { view: true, create: false, edit: true, delete: false, assign: true, approve: true },
      conditions: {},
    },
    {
      role_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
      resource_type: 'request',
      actions: { view: true, create: true, edit: false, delete: false, assign: false, approve: false },
      conditions: { own_records: true },
    },
  ], { onConflict: 'role_id,resource_type' });
  if (permErr) console.warn('Permissions note:', permErr.message);

  // 7. Temporary Bootstrap Super Admin (Environment Variable Only)
  const adminEmail = (env.auth.tempAdminEmail || 'admin@campusflow.local').trim().toLowerCase();
  console.log(`7. Ensuring Bootstrap Super Admin Account (${adminEmail})...`);

  const { data: existingAdmin } = await client
    .from('users')
    .select('id')
    .eq('email', adminEmail)
    .maybeSingle();

  let adminUserId = existingAdmin?.id;

  if (!existingAdmin) {
    const { data: newAdmin, error: adminErr } = await client
      .from('users')
      .insert({
        email: adminEmail,
        name: 'Super Administrator',
        college_id: '11111111-1111-1111-1111-111111111111',
        is_active: true,
        metadata: { is_bootstrap: true },
      })
      .select()
      .single();

    if (adminErr) console.error('Admin user error:', adminErr.message);
    adminUserId = newAdmin?.id;
  }

  if (adminUserId) {
    const { data: urMapping } = await client
      .from('user_roles')
      .select('id')
      .eq('user_id', adminUserId)
      .eq('role_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1')
      .maybeSingle();

    if (!urMapping) {
      await client.from('user_roles').insert({
        user_id: adminUserId,
        role_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      });
    }
  }

  console.log('✓ Clean baseline initialization complete!');
  console.log('  NOTE: No demo users, demo requests, demo pipelines, or demo workflows were seeded.');
  console.log('  All operational business structures are configuration-driven.');
};

if (process.argv[1]?.endsWith('supabase-seed.js')) {
  runSupabaseSeed().catch(err => {
    console.error('Seeding process failed:', err);
    process.exit(1);
  });
}
