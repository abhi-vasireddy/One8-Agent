import { db } from '../config/database.js';
import { forms, customFields, pipelineFields } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { FieldEngine } from './field-engine.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Form Engine — Assembles dynamic forms and validates submissions against field configurations
 */
export class FormEngine {
  /**
   * Assemble form metadata and field definitions for a pipeline or custom form
   */
  static async getFormDefinition({ formId, pipelineId, stageId }) {
    if (formId) {
      const [form] = await db.select().from(forms).where(eq(forms.id, formId));
      if (!form) throw new BadRequestError('Form not found');

      const fieldIds = form.fieldIds || [];
      const fields = fieldIds.length > 0
        ? await db.select().from(customFields).where(inArray(customFields.id, fieldIds))
        : [];

      return {
        form,
        fields,
      };
    }

    if (pipelineId) {
      // Find all fields associated with this pipeline
      const pFields = await db
        .select({
          pipelineField: pipelineFields,
          field: customFields,
        })
        .from(pipelineFields)
        .innerJoin(customFields, eq(pipelineFields.fieldId, customFields.id))
        .where(eq(pipelineFields.pipelineId, pipelineId));

      const filtered = stageId
        ? pFields.filter(f => !f.pipelineField.stageId || f.pipelineField.stageId === stageId)
        : pFields;

      return {
        fields: filtered.map(f => ({
          ...f.field,
          isRequired: f.pipelineField.isRequired,
          order: f.pipelineField.order,
        })),
      };
    }

    throw new BadRequestError('Either formId or pipelineId must be specified');
  }

  /**
   * Validate a submission payload against the form definition
   */
  static async validateSubmission({ formId, pipelineId, stageId, values }) {
    const { fields } = await this.getFormDefinition({ formId, pipelineId, stageId });
    const validationResult = FieldEngine.validateFields(fields, values);

    if (!validationResult.isValid) {
      throw new BadRequestError('Form validation failed', validationResult.errors);
    }

    return { isValid: true, sanitizedValues: values };
  }
}
