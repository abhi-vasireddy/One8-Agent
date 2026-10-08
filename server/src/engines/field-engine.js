/**
 * Field Engine — Dynamic validation and type enforcement for custom fields
 */

export class FieldEngine {
  /**
   * Validate a single field value against its definition and rules
   */
  static validateFieldValue(fieldDef, value) {
    const label = fieldDef.label || fieldDef.name || 'Field';
    const fieldType = fieldDef.fieldType || fieldDef.field_type;
    const isRequired = Boolean(fieldDef.isRequired ?? fieldDef.is_required);
    const validationRules = fieldDef.validationRules || fieldDef.validation_rules || {};
    const options = fieldDef.options || [];

    // 1. Required check
    if (isRequired && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${label} is required` };
    }

    if (value === undefined || value === null || value === '') {
      return { valid: true };
    }

    // 2. Type-specific validation
    switch (fieldType) {
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) return { valid: false, error: `${label} must be a valid number` };
        if (validationRules.min !== undefined && num < validationRules.min) {
          return { valid: false, error: `${label} must be at least ${validationRules.min}` };
        }
        if (validationRules.max !== undefined && num > validationRules.max) {
          return { valid: false, error: `${label} cannot exceed ${validationRules.max}` };
        }
        break;
      }

      case 'dropdown': {
        const allowed = Array.isArray(options) ? options.map(o => (typeof o === 'object' ? o.value : o)) : [];
        if (allowed.length > 0 && !allowed.includes(value)) {
          return { valid: false, error: `${label} has an invalid selection: ${value}` };
        }
        break;
      }

      case 'multi_select': {
        if (!Array.isArray(value)) return { valid: false, error: `${label} must be an array of values` };
        const allowed = Array.isArray(options) ? options.map(o => (typeof o === 'object' ? o.value : o)) : [];
        if (allowed.length > 0) {
          for (const item of value) {
            if (!allowed.includes(item)) {
              return { valid: false, error: `Invalid option '${item}' in ${label}` };
            }
          }
        }
        break;
      }

      case 'boolean': {
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return { valid: false, error: `${label} must be true or false` };
        }
        break;
      }

      case 'date': {
        const timestamp = Date.parse(value);
        if (isNaN(timestamp)) {
          return { valid: false, error: `${label} must be a valid date` };
        }
        break;
      }

      case 'text':
      case 'rich_text': {
        if (typeof value !== 'string') return { valid: false, error: `${label} must be a text string` };
        if (validationRules.minLength && value.length < validationRules.minLength) {
          return { valid: false, error: `${label} must be at least ${validationRules.minLength} characters` };
        }
        if (validationRules.maxLength && value.length > validationRules.maxLength) {
          return { valid: false, error: `${label} cannot exceed ${validationRules.maxLength} characters` };
        }
        if (validationRules.pattern) {
          const regex = new RegExp(validationRules.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: validationRules.patternError || `${label} format is invalid` };
          }
        }
        break;
      }

      default:
        // Other types pass basic checks
        break;
    }

    return { valid: true };
  }

  /**
   * Validate an entire payload of custom field values
   * @param {Array} fieldDefinitions - list of custom field records
   * @param {Object} values - key-value pairs where key is field name or field id
   */
  static validateFields(fieldDefinitions, values = {}) {
    const errors = {};

    for (const field of fieldDefinitions) {
      const val = values[field.name] !== undefined ? values[field.name] : values[field.id];
      const result = this.validateFieldValue(field, val);
      if (!result.valid) {
        errors[field.name] = result.error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
