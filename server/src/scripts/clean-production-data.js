import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

export async function cleanProductionData() {
  console.log('========================================================================');
  console.log('   CAMPUSFLOW AI — PRODUCTION DATA PURGE & CLEAN INSTALLATION RESET   ');
  console.log('========================================================================\n');

  const adminEmail = (env.auth.tempAdminEmail || 'admin@campusflow.local').trim().toLowerCase();
  console.log(`[Clean] Target Bootstrap Super Admin: ${adminEmail}`);

  // 1. Ensure Super Admin role exists
  const { data: saRole } = await supabaseAdmin
    .from('roles')
    .select('id, name')
    .ilike('name', 'Super Admin')
    .maybeSingle();

  if (!saRole) {
    throw new Error('Super Admin role not found in database roles table.');
  }

  // 2. Ensure bootstrap Super Admin exists in users
  let { data: bootstrapAdmin } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', adminEmail)
    .maybeSingle();

  if (!bootstrapAdmin) {
    console.log('[Clean] Creating bootstrap Super Admin user record...');
    const { data: newAdmin, error: createErr } = await supabaseAdmin
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

    if (createErr) throw createErr;
    bootstrapAdmin = newAdmin;
  }

  // Ensure role link for bootstrap admin
  const { data: existingMapping } = await supabaseAdmin
    .from('user_roles')
    .select('id')
    .eq('user_id', bootstrapAdmin.id)
    .eq('role_id', saRole.id)
    .maybeSingle();

  if (!existingMapping) {
    await supabaseAdmin.from('user_roles').insert({
      user_id: bootstrapAdmin.id,
      role_id: saRole.id,
    });
    console.log('[Clean] Linked Super Admin role to bootstrap admin.');
  }

  // 3. Delete demo notifications
  console.log('[Clean] Purging notifications...');
  await supabaseAdmin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 4. Delete demo messages & conversations
  console.log('[Clean] Purging messages & conversations...');
  await supabaseAdmin.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 5. Delete demo request history & requests
  console.log('[Clean] Purging request status history & requests...');
  await supabaseAdmin.from('request_status_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 6. Delete workflow executions & demo workflows
  console.log('[Clean] Purging workflow executions & demo workflows...');
  await supabaseAdmin.from('workflow_executions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 7. Delete pipeline stages, pipeline fields & pipelines
  console.log('[Clean] Purging demo pipelines, stages & fields...');
  await supabaseAdmin.from('pipeline_fields').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('pipeline_stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('pipelines').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 8. Delete demo custom fields
  console.log('[Clean] Purging custom fields...');
  await supabaseAdmin.from('custom_fields').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 9. Delete audit logs
  console.log('[Clean] Purging demo audit logs...');
  await supabaseAdmin.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 10. Delete demo user roles (keep only bootstrap admin's role)
  console.log('[Clean] Purging non-admin user role mappings...');
  await supabaseAdmin.from('user_roles').delete().neq('user_id', bootstrapAdmin.id);

  // 11. Delete demo users (keep only bootstrap admin)
  console.log('[Clean] Purging non-admin users from public.users...');
  const { data: nonAdminUsers } = await supabaseAdmin
    .from('users')
    .select('id, email, auth_id')
    .neq('id', bootstrapAdmin.id);

  if (nonAdminUsers && nonAdminUsers.length > 0) {
    for (const u of nonAdminUsers) {
      // If user had auth account, clean it up
      if (u.auth_id) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(u.auth_id);
        } catch (e) {
          // ignore
        }
      }
    }
    await supabaseAdmin.from('users').delete().neq('id', bootstrapAdmin.id);
    console.log(`[Clean] Removed ${nonAdminUsers.length} prefilled / demo users.`);
  }

  console.log('\n========================================================================');
  console.log('   CLEANUP COMPLETE: FRESH PRODUCTION ZERO-DATA BASELINE ESTABLISHED   ');
  console.log(`   Preserved Bootstrap Super Admin: ${adminEmail} (${bootstrapAdmin.id})`);
  console.log('========================================================================\n');
}

if (process.argv[1]?.endsWith('clean-production-data.js')) {
  cleanProductionData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Cleanup failed:', err);
      process.exit(1);
    });
}
