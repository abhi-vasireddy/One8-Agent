import { supabaseAdmin } from '../config/supabase.js';

export const agentTools = {
  checkStatus: async ({ requestNumber, user }) => {
    const { data: req } = await supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(*), pipeline:pipelines(*)')
      .ilike('request_number', requestNumber)
      .maybeSingle();

    if (!req) return { found: false, message: `No request found with number ${requestNumber}` };

    return {
      found: true,
      title: req.title,
      stage: req.stage?.name || 'Pending',
      pipeline: req.pipeline?.name,
      createdAt: req.created_at,
      priority: req.priority,
    };
  },

  listMyRequests: async ({ user }) => {
    let query = supabaseAdmin
      .from('requests')
      .select('*, stage:pipeline_stages(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (user?.id) {
      query = query.eq('created_by', user.id);
    }

    const { data: list } = await query;

    return {
      count: (list || []).length,
      requests: (list || []).map(r => ({
        requestNumber: r.request_number,
        title: r.title,
        priority: r.priority,
        stage: r.stage?.name || 'In Review',
      })),
    };
  },
};
