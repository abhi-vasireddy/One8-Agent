import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { departments } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  branchId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  settings: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

// GET /api/config/departments — List departments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    let result = [];
    try {
      result = await db
        .select()
        .from(departments)
        .where(eq(departments.collegeId, collegeId))
        .orderBy(departments.name);
    } catch (dbErr) {
      const { data } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('college_id', collegeId)
        .order('name');
      result = (data || []).map(d => ({
        id: d.id,
        collegeId: d.college_id,
        branchId: d.branch_id,
        name: d.name,
        code: d.code,
        description: d.description,
        settings: d.settings || {},
        isActive: d.is_active,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }

    return response.success(res, result);
  } catch (err) { next(err); }
});

// POST /api/config/departments — Create department
router.post('/', authenticate, requireRole('Super Admin'), validate(createDepartmentSchema), auditMiddleware('department'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const insertPayload = {
      college_id: collegeId,
      branch_id: req.body.branchId || null,
      name: req.body.name,
      code: req.body.code,
      description: req.body.description || null,
      settings: req.body.settings || {},
      is_active: req.body.isActive !== false,
    };

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return response.created(res, data, 'Department created successfully');
  } catch (err) { next(err); }
});

export default router;
