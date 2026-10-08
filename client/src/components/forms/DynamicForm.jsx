import React, { useState } from 'react';
import { FieldRenderer } from '../fields/FieldRenderer.jsx';

export const DynamicForm = ({ fields = [], initialValues = {}, onSubmit, submitLabel = 'Submit Application' }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (name, val) => {
    setValues(prev => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side required check
    const newErrors = {};
    for (const f of fields) {
      if (f.isRequired) {
        const v = values[f.name];
        if (v === undefined || v === null || v === '') {
          newErrors[f.name] = `${f.label} is required`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      alert(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(f => (
        <FieldRenderer
          key={f.id || f.name}
          field={f}
          value={values[f.name]}
          onChange={handleFieldChange}
          error={errors[f.name]}
        />
      ))}

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{ minWidth: '160px' }}
        >
          {isSubmitting ? 'Processing...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
