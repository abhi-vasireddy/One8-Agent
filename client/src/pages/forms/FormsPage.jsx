import React, { useState, useEffect } from 'react';
import { api } from '../../api/index.js';
import { DynamicForm } from '../../components/forms/DynamicForm.jsx';
import { FileText, CheckCircle2, Code2 } from 'lucide-react';

export const FormsPage = () => {
  const [fields, setFields] = useState([]);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const res = await api.fields.list();
      setFields(res?.data || []);
    } catch (err) {
      console.warn('Failed to fetch custom fields:', err.message);
      setFields([]);
    }
  };

  const handleTestSubmit = async (values) => {
    setSubmissionResult(values);
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-blue">Form Engine</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Metadata Dynamic Assembly</span>
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
          Dynamic Form Sandbox
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Forms are not hardcoded. They are assembled on-the-fly from the database custom fields catalog.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Live Form Preview */}
        <div style={{
          padding: '24px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="var(--accent-primary)" />
            <span>Interactive Form Preview</span>
          </h2>

          <DynamicForm
            fields={fields}
            onSubmit={handleTestSubmit}
            submitLabel="Validate & Preview Payload"
          />
        </div>

        {/* Real-time Submissions Payload Inspector */}
        <div style={{
          padding: '24px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={16} color="var(--accent-primary)" />
            <span>Validated JSON Payload</span>
          </h2>

          <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            When users submit, values are validated server-side by <code>FieldEngine</code> before being committed to <code>requests.customFieldValues</code>.
          </p>

          {submissionResult ? (
            <div style={{
              background: '#F8FAFC',
              padding: '14px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.785rem',
              color: '#0F172A',
              overflowX: 'auto',
            }}>
              <pre>{JSON.stringify(submissionResult, null, 2)}</pre>
            </div>
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '4px',
              fontSize: '0.785rem',
              color: 'var(--text-dim)',
              background: '#F8FAFC',
            }}>
              Fill out the form and submit to inspect the validated data payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
