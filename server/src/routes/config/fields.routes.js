import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { customFields, pipelineFields } from '../../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditMiddleware } from '../../engines/audit-engine.js';
import * as response from '../../utils/api-response.js';

const router = Router();

const formatField = (f) => ({
  id: f.id,
  collegeId: f.college_id || f.collegeId,
  name: f.name,
  label: f.label,
  description: f.description,
  fieldType: f.field_type || f.fieldType,
  entityType: f.entity_type || f.entityType,
  isRequired: f.is_required !== undefined ? f.is_required : f.isRequired,
  defaultValue: f.default_value !== undefined ? f.default_value : f.defaultValue,
  options: f.options || [],
  validationRules: f.validation_rules || f.validationRules || {},
  placeholder: f.placeholder,
  order: f.order || 0,
  visibility: f.visibility || 'visible',
  isEditable: f.is_editable !== undefined ? f.is_editable : f.isEditable,
  isReadOnly: f.is_read_only !== undefined ? f.is_read_only : f.isReadOnly,
  createdAt: f.created_at || f.createdAt,
  updatedAt: f.updated_at || f.updatedAt,
});

const fieldSchema = z.object({
  name: z.string().min(1).max(255),
  label: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  fieldType: z.enum([
    'text', 'number', 'dropdown', 'date', 'file',
    'boolean', 'multi_select', 'rich_text', 'email', 'phone'
  ]),
  entityType: z.string().max(50).optional().default('request'),
  isRequired: z.boolean().optional().default(false),
  defaultValue: z.any().optional().nullable(),
  options: z.array(z.any()).optional().default([]),
  validationRules: z.record(z.any()).optional().default({}),
  placeholder: z.string().max(255).optional().nullable(),
  order: z.number().int().optional().default(0),
  visibility: z.string().max(20).optional().default('visible'),
  isEditable: z.boolean().optional().default(true),
  isReadOnly: z.boolean().optional().default(false),
});

// GET /api/config/fields — List all custom fields for this college
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_fields')
      .select('*')
      .eq('college_id', req.user.collegeId)
      .order('order', { ascending: true });
    
    if (error) {
      // Fallback to Drizzle if Supabase query fails
      const dbFields = await db
        .select()
        .from(customFields)
        .where(eq(customFields.collegeId, req.user.collegeId))
        .orderBy(asc(customFields.order));
      return response.success(res, dbFields.map(formatField));
    }

    const fields = (data || []).map(formatField);
    return response.success(res, fields);
  } catch (err) { next(err); }
});

const DEFAULT_SECTIONS = [
  { id: 'all', name: 'All Fields' },
  { id: 'contact', name: 'Contact Details' },
  { id: 'basic', name: 'Basic Details' },
  { id: 'parent', name: 'Parent Details' },
  { id: 'education', name: 'Education Details' },
  { id: 'grievance', name: 'Grievance Details' },
];

// GET /api/config/fields/sections — List all sections for custom fields
router.get('/sections', authenticate, async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';

    // 1. Fetch saved sections from colleges.settings
    const { data: college } = await supabaseAdmin
      .from('colleges')
      .select('settings')
      .eq('id', collegeId)
      .maybeSingle();

    const savedSections = college?.settings?.field_sections || [];

    // 2. Combine defaults and saved sections
    const sectionMap = new Map();
    DEFAULT_SECTIONS.forEach(s => sectionMap.set(s.id, s));
    savedSections.forEach(s => {
      if (s && s.id && s.name) sectionMap.set(s.id, s);
    });

    // 3. Auto-discover any sections used by existing fields
    const { data: fields } = await supabaseAdmin
      .from('custom_fields')
      .select('validation_rules')
      .eq('college_id', collegeId);

    (fields || []).forEach(f => {
      const secId = f.validation_rules?.section;
      if (secId && !sectionMap.has(secId)) {
        const title = secId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        sectionMap.set(secId, {
          id: secId,
          name: title.endsWith('Details') ? title : `${title} Details`,
        });
      }
    });

    return response.success(res, Array.from(sectionMap.values()));
  } catch (err) { next(err); }
});

// POST /api/config/fields/sections — Create a new custom field section
router.post('/sections', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { name, id: customId } = req.body;
    if (!name || !name.trim()) {
      return response.badRequest(res, 'Section name is required');
    }

    const trimmedName = name.trim();
    const sectionId = (customId || trimmedName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '')) || `section_${Date.now()}`;
    const newSection = { id: sectionId, name: trimmedName };

    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';

    // Fetch existing settings
    const { data: college } = await supabaseAdmin
      .from('colleges')
      .select('settings')
      .eq('id', collegeId)
      .maybeSingle();

    const currentSettings = college?.settings || {};
    const existingSections = currentSettings.field_sections || [
      { id: 'contact', name: 'Contact Details' },
      { id: 'basic', name: 'Basic Details' },
      { id: 'parent', name: 'Parent Details' },
      { id: 'education', name: 'Education Details' },
      { id: 'grievance', name: 'Grievance Details' },
    ];

    // Check if section already exists
    const idx = existingSections.findIndex(s => s.id === sectionId);
    let updatedSections;
    if (idx >= 0) {
      existingSections[idx] = newSection;
      updatedSections = existingSections;
    } else {
      updatedSections = [...existingSections, newSection];
    }

    // Persist to Supabase in colleges.settings.field_sections
    const { error } = await supabaseAdmin
      .from('colleges')
      .update({
        settings: { ...currentSettings, field_sections: updatedSections },
        updated_at: new Date().toISOString(),
      })
      .eq('id', collegeId);

    if (error) {
      console.error('Failed to update college settings with new section:', error);
      throw error;
    }

    return response.created(res, newSection, 'Section created successfully');
  } catch (err) { next(err); }
});

// DELETE /api/config/fields/sections/:sectionId — Delete a custom field section
router.delete('/sections/:sectionId', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    if (['all', 'contact', 'basic'].includes(sectionId)) {
      return response.badRequest(res, 'Cannot delete standard system sections');
    }

    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';

    const { data: college } = await supabaseAdmin
      .from('colleges')
      .select('settings')
      .eq('id', collegeId)
      .maybeSingle();

    const currentSettings = college?.settings || {};
    const existingSections = currentSettings.field_sections || [];
    const updatedSections = existingSections.filter(s => s.id !== sectionId);

    await supabaseAdmin
      .from('colleges')
      .update({
        settings: { ...currentSettings, field_sections: updatedSections },
        updated_at: new Date().toISOString(),
      })
      .eq('id', collegeId);

    return response.success(res, null, 'Section deleted successfully');
  } catch (err) { next(err); }
});

// POST /api/config/fields — Create custom field
router.post('/', authenticate, requireRole('Super Admin', 'Admin'), validate(fieldSchema), auditMiddleware('custom_field'), async (req, res, next) => {
  try {
    // Check if req.user.id exists in the users table to satisfy foreign key constraint
    let validUserId = null;
    if (req.user?.id) {
      const { data: userExists } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', req.user.id)
        .maybeSingle();
      if (userExists?.id) {
        validUserId = userExists.id;
      }
    }

    const collegeId = req.user?.collegeId || '11111111-1111-1111-1111-111111111111';

    const insertPayload = {
      name: req.body.name,
      label: req.body.label,
      description: req.body.description || '',
      field_type: req.body.fieldType,
      entity_type: req.body.entityType || 'request',
      is_required: req.body.isRequired || false,
      default_value: req.body.defaultValue ?? null,
      options: req.body.options || [],
      validation_rules: req.body.validationRules || {},
      placeholder: req.body.placeholder || null,
      order: req.body.order || 0,
      visibility: req.body.visibility || 'visible',
      is_editable: req.body.isEditable !== false,
      is_read_only: req.body.isReadOnly || false,
      college_id: collegeId,
      created_by: validUserId,
    };

    const { data, error } = await supabaseAdmin
      .from('custom_fields')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.warn('Supabase custom_fields insert error, attempting Drizzle fallback:', error.message);
      const [dbField] = await db
        .insert(customFields)
        .values({
          ...req.body,
          collegeId,
          createdBy: validUserId,
        })
        .returning();
      return response.created(res, formatField(dbField), 'Custom field created');
    }

    return response.created(res, formatField(data), 'Custom field created');
  } catch (err) { next(err); }
});

// PUT /api/config/fields/:id — Update field definition
router.put('/:id', authenticate, requireRole('Super Admin', 'Admin'), validate(fieldSchema.partial()), auditMiddleware('custom_field'), async (req, res, next) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.label !== undefined) updateData.label = req.body.label;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.fieldType !== undefined) updateData.field_type = req.body.fieldType;
    if (req.body.entityType !== undefined) updateData.entity_type = req.body.entityType;
    if (req.body.isRequired !== undefined) updateData.is_required = req.body.isRequired;
    if (req.body.defaultValue !== undefined) updateData.default_value = req.body.defaultValue;
    if (req.body.options !== undefined) updateData.options = req.body.options;
    if (req.body.validationRules !== undefined) updateData.validation_rules = req.body.validationRules;
    if (req.body.placeholder !== undefined) updateData.placeholder = req.body.placeholder;
    if (req.body.order !== undefined) updateData.order = req.body.order;
    if (req.body.visibility !== undefined) updateData.visibility = req.body.visibility;
    if (req.body.isEditable !== undefined) updateData.is_editable = req.body.isEditable;
    if (req.body.isReadOnly !== undefined) updateData.is_read_only = req.body.isReadOnly;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('custom_fields')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error || !data) {
      const [dbUpdated] = await db
        .update(customFields)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(customFields.id, req.params.id))
        .returning();
      if (!dbUpdated) return response.notFound(res, 'Field not found');
      return response.success(res, formatField(dbUpdated), 'Field updated');
    }

    return response.success(res, formatField(data), 'Field updated');
  } catch (err) { next(err); }
});

// DELETE /api/config/fields/:id
router.delete('/:id', authenticate, requireRole('Super Admin'), auditMiddleware('custom_field'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('custom_fields')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      await db.delete(customFields).where(eq(customFields.id, req.params.id));
    }
    return response.success(res, null, 'Field deleted');
  } catch (err) { next(err); }
});

// Pipeline fields mappings:
// POST /api/config/fields/assign-to-pipeline
router.post('/assign-to-pipeline', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const { pipelineId, fieldId, isRequired = false, stageId = null, order = 0 } = req.body;

    const [assigned] = await db
      .insert(pipelineFields)
      .values({
        pipelineId,
        fieldId,
        isRequired,
        stageId,
        order,
      })
      .returning();

    return response.created(res, assigned, 'Field assigned to pipeline');
  } catch (err) { next(err); }
});

// DELETE /api/config/fields/remove-from-pipeline/:pipelineFieldId
router.delete('/remove-from-pipeline/:pipelineFieldId', authenticate, requireRole('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    await db.delete(pipelineFields).where(eq(pipelineFields.id, req.params.pipelineFieldId));
    return response.success(res, null, 'Field removed from pipeline');
  } catch (err) { next(err); }
});

export default router;
