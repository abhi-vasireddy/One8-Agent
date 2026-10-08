import { db } from '../config/database.js';
import { auditLogs } from '../db/schema.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Audit Engine — Records all configuration changes
 */
export class AuditEngine {
  /**
   * Log an audit event
   */
  static async log({ userId, action, entityType, entityId, oldValue, newValue, ipAddress }) {
    try {
      // Validate userId if provided to prevent foreign key constraint violations
      let validUserId = null;
      if (userId) {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        if (userRow?.id) {
          validUserId = userRow.id;
        }
      }

      const { error } = await supabaseAdmin.from('audit_logs').insert({
        user_id: validUserId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ip_address: ipAddress || null,
      });

      if (error) {
        // Fallback to Drizzle
        await db.insert(auditLogs).values({
          userId: validUserId,
          action,
          entityType,
          entityId,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ipAddress,
        });
      }
    } catch (err) {
      console.warn('Audit log write skipped:', err?.message || err);
    }
  }
}

/**
 * Audit middleware — automatically logs CUD operations on config routes
 */
export const auditMiddleware = (entityType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only log successful mutations
      if (body?.success && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const action = {
          POST: 'created',
          PUT: 'updated',
          PATCH: 'updated',
          DELETE: 'deleted',
        }[req.method];

        AuditEngine.log({
          userId: req.user?.id,
          action,
          entityType,
          entityId: req.params?.id || body?.data?.id,
          oldValue: req._auditOldValue || null,
          newValue: req.body || null,
          ipAddress: req.ip,
        }).catch(err => console.error('Audit log failed:', err));
      }

      return originalJson(body);
    };

    next();
  };
};
