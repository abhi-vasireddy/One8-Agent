import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { slaRules } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const slaSchema = z.object({
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid().optional().nullable(),
  hours: z.number().int().min(1),
  escalationConfig: z.record(z.any()).optional().default({}),
  notificationConfig: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

// GET /api/config/sla/:pipelineId
router.get('/:pipelineId', authenticate, async (req, res, next) => {
  try {
    const list = await db
      .select()
      .from(slaRules)
      .where(eq(slaRules.pipelineId, req.params.pipelineId));

    return response.success(res, list);
  } catch (err) { next(err); }
});

// POST /api/config/sla
router.post('/', authenticate, requireRole('Super Admin', 'Admin'), validate(slaSchema), auditMiddleware('sla_rule'), async (req, res, next) => {
  try {
    const [created] = await db
      .insert(slaRules)
      .values(req.body)
      .returning();

    return response.created(res, created, 'SLA rule created');
  } catch (err) { next(err); }
});

// DELETE /api/config/sla/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('sla_rule'), async (req, res, next) => {
  try {
    await db.delete(slaRules).where(eq(slaRules.id, req.params.id));
    return response.success(res, null, 'SLA rule deleted');
  } catch (err) { next(err); }
});

export default router;
