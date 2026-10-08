import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { colleges, campuses, departments } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

// GET /api/config/college — Current college info
router.get('/', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: college } = await supabaseAdmin
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .maybeSingle();

    if (!college) return response.notFound(res, 'College not found');
    return response.success(res, college);
  } catch (err) { next(err); }
});

// PUT /api/config/college — Update institution settings/name/logo
router.put('/', authenticate, requireRole('Super Admin'), auditMiddleware('college'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: existing } = await supabaseAdmin
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .maybeSingle();

    if (!existing) return response.notFound(res, 'College not found');
    req._auditOldValue = existing;

    const updatePayload = {
      name: req.body.name || existing.name,
      logo: req.body.logo !== undefined ? req.body.logo : existing.logo,
      settings: req.body.settings || existing.settings,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabaseAdmin
      .from('colleges')
      .update(updatePayload)
      .eq('id', collegeId)
      .select()
      .maybeSingle();

    if (error || !updated) throw error;
    return response.success(res, updated, 'College settings updated');
  } catch (err) { next(err); }
});

// Campuses:
// GET /api/config/college/campuses
router.get('/campuses', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: list } = await supabaseAdmin
      .from('campuses')
      .select('*')
      .eq('college_id', collegeId)
      .order('name');

    return response.success(res, list || []);
  } catch (err) { next(err); }
});

// POST /api/config/college/campuses
router.post('/campuses', authenticate, requireRole('Super Admin'), auditMiddleware('campus'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: created, error } = await supabaseAdmin
      .from('campuses')
      .insert({
        ...req.body,
        college_id: collegeId,
      })
      .select()
      .single();

    if (error) throw error;
    return response.created(res, created, 'Campus added');
  } catch (err) { next(err); }
});

// Departments:
// GET /api/config/college/departments
router.get('/departments', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: list } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('college_id', collegeId)
      .order('name');

    return response.success(res, list || []);
  } catch (err) { next(err); }
});

// POST /api/config/college/departments
router.post('/departments', authenticate, requireRole('Super Admin'), auditMiddleware('department'), async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';
    const { data: created, error } = await supabaseAdmin
      .from('departments')
      .insert({
        ...req.body,
        college_id: collegeId,
      })
      .select()
      .single();

    if (error) throw error;
    return response.created(res, created, 'Department added');
  } catch (err) { next(err); }
});

export default router;
