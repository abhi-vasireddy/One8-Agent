import React from 'react';

export const FieldRenderer = ({ field, value, onChange, error }) => {
  const {
    id,
    name,
    label,
    fieldType,
    isRequired,
    placeholder,
    options = [],
    isReadOnly,
    description
  } = field;

  const handleChange = (newVal) => {
    if (onChange) onChange(name || id, newVal);
  };

  const parsedOptions = Array.isArray(options) 
    ? options.map(o => (typeof o === 'object' ? o : { label: o, value: o }))
    : [];

  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{label}</span>
        {isRequired && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>

      {description && (
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
          {description}
        </div>
      )}

      {/* Dynamic Type Dispatch */}
      {fieldType === 'text' && (
        <input
          type="text"
          className="input"
          placeholder={placeholder || `Enter ${label}`}
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
        />
      )}

      {fieldType === 'number' && (
        <input
          type="number"
          step="any"
          className="input"
          placeholder={placeholder || '0.00'}
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isReadOnly}
        />
      )}

      {fieldType === 'dropdown' && (
        <select
          className="select"
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
        >
          <option value="">{placeholder || `-- Select ${label} --`}</option>
          {parsedOptions.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {fieldType === 'boolean' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '6px' }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={isReadOnly}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
            {value ? 'Yes / Enabled' : 'No / Disabled'}
          </span>
        </label>
      )}

      {fieldType === 'date' && (
        <input
          type="date"
          className="input"
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
        />
      )}

      {(fieldType === 'rich_text' || fieldType === 'textarea') && (
        <textarea
          className="textarea"
          placeholder={placeholder || `Enter details for ${label}`}
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
        />
      )}

      {fieldType === 'multi_select' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {parsedOptions.map((opt, i) => {
            const isSelected = Array.isArray(value) && value.includes(opt.value);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const currentArr = Array.isArray(value) ? [...value] : [];
                  const nextArr = isSelected
                    ? currentArr.filter(v => v !== opt.value)
                    : [...currentArr, opt.value];
                  handleChange(nextArr);
                }}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {fieldType === 'file' && (
        <div style={{
          border: '1px dashed var(--border-subtle)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleChange(file.name);
            }}
            disabled={isReadOnly}
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
          />
          {value && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '6px' }}>
              Selected file: {value}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};
