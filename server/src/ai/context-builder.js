import { supabaseAdmin } from '../config/supabase.js';

/**
 * AI Context Builder — Dynamically gathers current college metadata to inform the AI prompt
 */
export class ContextBuilder {
  static async buildContext(collegeId, user) {
    try {
      // 1. Load active pipelines with stages
      const { data: activePipelines } = await supabaseAdmin
        .from('pipelines')
        .select('*, stages:pipeline_stages(*)')
        .eq('is_active', true)
        .eq('is_archived', false);

      const pipelineData = (activePipelines || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        stages: (p.stages || []).map(s => ({
          id: s.id,
          name: s.name,
          order: s.order,
          slaHours: s.sla_hours,
        })),
      }));

      // 2. Load custom fields
      const { data: fieldsData } = await supabaseAdmin
        .from('custom_fields')
        .select('name, label, field_type, is_required');

      const fields = (fieldsData || []).map(f => ({
        name: f.name,
        label: f.label,
        type: f.field_type,
        isRequired: f.is_required,
      }));

      // 3. Load active branches
      const { data: branchesData } = await supabaseAdmin
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true);

      return {
        user: {
          id: user?.id,
          name: user?.name,
          roles: user?.roles?.map(r => r.name || r.roleName) || [],
          isSuperAdmin: user?.isSuperAdmin,
        },
        pipelines: pipelineData,
        fields,
        branches: branchesData || [],
      };
    } catch (err) {
      console.error('Failed to build dynamic AI context:', err.message);
      return {
        pipelines: [],
        fields: [],
        branches: [],
        user: { name: user?.name },
      };
    }
  }
}
