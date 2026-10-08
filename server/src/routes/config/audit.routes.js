import { Router } from 'express';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { auditLogs, users } from '../../db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as response from '../../utils/api-response.js';

const router = Router();

// GET /api/config/audit-logs
router.get('/', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;

    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(Number(limit));

    if (error || !logs) {
      try {
        const rows = await db
          .select({
            log: auditLogs,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .orderBy(desc(auditLogs.timestamp))
          .limit(Number(limit));

        const formatted = rows.map(r => ({
          ...r.log,
          userName: r.user?.name || 'System / Automation',
          userEmail: r.user?.email,
        }));
        return response.success(res, formatted);
      } catch (dbErr) {
        return response.success(res, []);
      }
    }

    const formatted = logs.map(l => ({
      id: l.id,
      userId: l.user_id,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      ipAddress: l.ip_address,
      timestamp: l.timestamp,
      userName: 'Administrator',
    }));

    return response.success(res, formatted);
  } catch (err) { next(err); }
});

export default router;
