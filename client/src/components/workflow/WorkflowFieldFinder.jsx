import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Cpu, 
  X, 
  Plus, 
  Check, 
  ArrowRight, 
  Sparkles,
  HelpCircle,
  Zap,
  PlayCircle,
  ChevronRight
} from 'lucide-react';

export const SYSTEM_FIELDS = [
  { id: 'sys-priority', name: 'priority', label: 'Priority Level', type: 'select', category: 'system', description: 'Urgency tier: low, medium, high, urgent' },
  { id: 'sys-title', name: 'title', label: 'Request Title', type: 'text', category: 'system', description: 'Primary subject line of applicant submission' },
  { id: 'sys-description', name: 'description', label: 'Description', type: 'text', category: 'system', description: 'Detailed context or statement submitted' },
  { id: 'sys-status', name: 'stage_id', label: 'Current Stage (State)', type: 'stage', category: 'system', description: 'Active stage pointer in the pipeline' },
  { id: 'sys-reqnum', name: 'request_number', label: 'Ticket / Request ID', type: 'text', category: 'system', description: 'Unique identifier, e.g. REQ-123456' },
  { id: 'sys-assigned', name: 'assigned_user_id', label: 'Assigned Officer / User', type: 'user', category: 'system', description: 'UUID of assigned staff member' },
  { id: 'sys-created', name: 'created_at', label: 'Creation Timestamp', type: 'datetime', category: 'system', description: 'ISO date when record was initiated' },
];

/**
 * WorkflowFieldFinder
 * Interactive, searchable explorer for Pipeline States (Stages), Custom Fields,
 * System Properties, and Roles.
 */
export const WorkflowFieldFinder = ({
  stages = [],
  fields = [],
  roles = [],
  pipelineName = 'Current Pipeline',
  selectedNode = null,
  onSelect = null,
  onAddNode = null,
  onClose = null,
  compact = false,
}) => {
  const [activeCategory, setActiveCategory] = useState('stages'); // 'stages' | 'fields' | 'system' | 'roles' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize options
  const stageItems = useMemo(() => {
    return (stages || []).map((s, index) => ({
      id: s.id,
      name: s.name,
      label: s.name,
      color: s.color || '#6366f1',
      order: s.order ?? index,
      isInitial: Boolean(s.isInitial || s.is_initial),
      isFinal: Boolean(s.isFinal || s.is_final),
      description: s.description || (s.isInitial ? 'Initial applicant intake state' : s.isFinal ? 'Terminal resolution state' : `Pipeline stage #${index + 1}`),
      category: 'stages',
      type: 'stage',
      raw: s,
    }));
  }, [stages]);

  const fieldItems = useMemo(() => {
    return (fields || []).map(f => ({
      id: f.id,
      name: f.name,
      label: f.label || f.name,
      fieldType: f.fieldType || f.field_type || 'text',
      isRequired: Boolean(f.isRequired || f.is_required),
      description: f.description || `Custom field (${f.fieldType || 'text'})`,
      category: 'fields',
      type: 'field',
      raw: f,
    }));
  }, [fields]);

  const roleItems = useMemo(() => {
    return (roles || []).map(r => ({
      id: r.id,
      name: r.name,
      label: r.name,
      description: r.description || 'Institutional access role',
      category: 'roles',
      type: 'role',
      raw: r,
    }));
  }, [roles]);

  const systemItems = useMemo(() => {
    return SYSTEM_FIELDS.map(f => ({
      ...f,
      raw: f,
    }));
  }, []);

  // Filtered items based on selected category and reactive search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let pool = [];
    if (activeCategory === 'stages') pool = stageItems;
    else if (activeCategory === 'fields') pool = fieldItems;
    else if (activeCategory === 'system') pool = systemItems;
    else if (activeCategory === 'roles') pool = roleItems;
    else pool = [...stageItems, ...fieldItems, ...systemItems, ...roleItems];

    if (!q) return pool;

    return pool.filter(item => {
      const matchName = item.name?.toLowerCase().includes(q);
      const matchLabel = item.label?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchType = (item.fieldType || item.type)?.toLowerCase().includes(q);
      return matchName || matchLabel || matchDesc || matchType;
    });
  }, [activeCategory, searchQuery, stageItems, fieldItems, systemItems, roleItems]);

  // Contextual advice based on currently selected node
  const contextualHint = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.type === 'condition') {
      return {
        text: 'Select a Field or Stage below to populate Target Field for Condition check',
        color: '#D97706',
        preferredCategory: 'fields',
      };
    }
    if (selectedNode.type === 'action') {
      if (selectedNode.data?.actionType === 'change_stage') {
        return {
          text: 'Select a Stage below to configure Target State for this Action step',
          color: '#059669',
          preferredCategory: 'stages',
        };
      }
      if (selectedNode.data?.actionType === 'assign_role') {
        return {
          text: 'Select a Role below to assign this request to',
          color: '#2563EB',
          preferredCategory: 'roles',
        };
      }
      if (selectedNode.data?.actionType === 'update_field') {
        return {
          text: 'Select a Custom Field to update',
          color: '#7C3AED',
          preferredCategory: 'fields',
        };
      }
    }
    if (selectedNode.type === 'trigger') {
      return {
        text: 'Select a Stage to fire this workflow when a request enters that state',
        color: '#2563EB',
        preferredCategory: 'stages',
      };
    }
    return null;
  }, [selectedNode]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#FFFFFF',
      color: 'var(--text-main)',
      fontSize: '0.85rem',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FAFBFD',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}>
            <Sparkles size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
              Variables & States Explorer
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Pipeline: <strong style={{ color: 'var(--text-secondary)' }}>{pipelineName}</strong>
            </div>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose} 
            className="btn btn-secondary btn-icon" 
            style={{ border: 'none', padding: '4px', background: 'transparent' }}
            title="Close Explorer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Contextual Banner if Node Selected */}
      {contextualHint && (
        <div style={{
          padding: '8px 14px',
          background: `${contextualHint.color}10`,
          borderBottom: `1px solid ${contextualHint.color}30`,
          fontSize: '0.725rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: contextualHint.color,
          fontWeight: 500,
        }}>
          <ArrowRight size={13} style={{ flexShrink: 0 }} />
          <span>{contextualHint.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ padding: '12px 14px 8px 14px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeCategory === 'stages' ? 'Search pipeline states / stages...' :
              activeCategory === 'fields' ? 'Search custom fields & variables...' :
              activeCategory === 'roles' ? 'Search roles (Admission Officer, Dean...)...' :
              activeCategory === 'system' ? 'Search system properties...' :
              'Search stages, fields, variables...'
            }
            style={{
              paddingLeft: '32px',
              paddingRight: searchQuery ? '30px' : '10px',
              fontSize: '0.8125rem',
              height: '34px',
              background: '#FFFFFF',
              borderColor: 'var(--border-subtle)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px',
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Reactive Category Filter Pills / Options */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 14px 10px 14px',
        borderBottom: '1px solid var(--border-light)',
        overflowX: 'auto',
      }}>
        {[
          { key: 'stages', label: 'Stages', count: stageItems.length, icon: Layers, color: '#6366F1' },
          { key: 'fields', label: 'Custom Fields', count: fieldItems.length, icon: Sliders, color: '#7C3AED' },
          { key: 'system', label: 'System', count: systemItems.length, icon: Cpu, color: '#0284C7' },
          { key: 'roles', label: 'Roles', count: roleItems.length, icon: ShieldCheck, color: '#059669' },
          { key: 'all', label: 'All', count: stageItems.length + fieldItems.length + systemItems.length + roleItems.length, icon: Sparkles, color: '#64748B' },
        ].map(cat => {
          const isActive = activeCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.735rem',
                fontWeight: isActive ? 600 : 500,
                border: isActive ? `1px solid ${cat.color}` : '1px solid var(--border-subtle)',
                background: isActive ? `${cat.color}14` : '#FFFFFF',
                color: isActive ? cat.color : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={12} style={{ color: isActive ? cat.color : 'var(--text-dim)' }} />
              <span>{cat.label}</span>
              <span style={{
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '10px',
                background: isActive ? cat.color : '#F1F5F9',
                color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                fontWeight: 600,
              }}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {filteredItems.length === 0 ? (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            color: 'var(--text-dim)',
          }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
              <Search size={22} color="var(--border-subtle)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              No {activeCategory === 'stages' ? 'pipeline stages' : 'items'} found
            </div>
            <div style={{ fontSize: '0.725rem', marginTop: '4px' }}>
              {searchQuery ? `No matches found for "${searchQuery}"` : 'No items configured in this category.'}
            </div>
          </div>
        ) : (
          filteredItems.map(item => {
            const isStage = item.category === 'stages';
            const isField = item.category === 'fields';
            const isRole = item.category === 'roles';
            const isSystem = item.category === 'system';

            return (
              <div
                key={item.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
                className="glass-card"
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {/* Visual icon / color pip */}
                    {isStage ? (
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: item.color || '#6366f1',
                        boxShadow: `0 0 0 2px ${item.color}30`,
                        flexShrink: 0,
                      }} />
                    ) : isRole ? (
                      <ShieldCheck size={14} color="#059669" style={{ flexShrink: 0 }} />
                    ) : isField ? (
                      <Sliders size={14} color="#7C3AED" style={{ flexShrink: 0 }} />
                    ) : (
                      <Cpu size={14} color="#0284C7" style={{ flexShrink: 0 }} />
                    )}

                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.label}
                    </span>
                  </div>

                  {/* Category / Type Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isStage && item.isInitial && (
                      <span className="badge badge-blue" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                        Initial
                      </span>
                    )}
                    {isStage && item.isFinal && (
                      <span className="badge badge-green" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                        Final
                      </span>
                    )}
                    {isField && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#F5F3FF',
                        color: '#7C3AED',
                        border: '1px solid #DDD6FE',
                        textTransform: 'uppercase',
                      }}>
                        {item.fieldType}
                      </span>
                    )}
                    {isSystem && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#F0F9FF',
                        color: '#0284C7',
                      }}>
                        System
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub details: programmatic key and description */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{
                    fontSize: '0.685rem',
                    color: 'var(--text-muted)',
                    fontFamily: isStage || isRole ? 'inherit' : 'var(--font-mono)',
                    background: isStage || isRole ? 'transparent' : '#F8FAFC',
                    padding: isStage || isRole ? '0' : '1px 5px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {isStage ? `Sequence: Order #${item.order}` : item.name}
                  </div>

                  {item.isRequired && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                      *Required
                    </span>
                  )}
                </div>

                {item.description && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {item.description}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-light)',
                }}>
                  {/* Primary Selection: apply to active node */}
                  {onSelect && (
                    <button
                      onClick={() => onSelect(item, item.category)}
                      className="btn btn-sm btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        justifyContent: 'center',
                        color: isStage ? item.color : 'var(--accent-primary)',
                      }}
                      title={`Apply ${item.label} to active node`}
                    >
                      <Check size={11} />
                      <span>{selectedNode ? 'Apply to Selected Node' : 'Select'}</span>
                    </button>
                  )}

                  {/* Quick-Add Node onto Canvas */}
                  {onAddNode && isStage && (
                    <button
                      onClick={() => onAddNode('action', {
                        label: `Move to ${item.name}`,
                        actionType: 'change_stage',
                        targetStageId: item.id,
                        targetStageName: item.name,
                        targetStageColor: item.color,
                      })}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#059669' }}
                      title="Add Action node that transitions to this stage"
                    >
                      <Zap size={11} />
                      <span>+ Action</span>
                    </button>
                  )}

                  {onAddNode && (isField || isSystem) && (
                    <button
                      onClick={() => onAddNode('condition', {
                        label: `Check ${item.label}`,
                        field: item.name,
                        operator: '==',
                        value: '',
                      })}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#D97706' }}
                      title="Add Condition node evaluating this field"
                    >
                      <HelpCircle size={11} />
                      <span>+ Condition</span>
                    </button>
                  )}

                  {onAddNode && isRole && (
                    <button
                      onClick={() => onAddNode('action', {
                        label: `Assign to ${item.name}`,
                        actionType: 'assign_role',
                        roleName: item.name,
                        assignedRoleId: item.id,
                      })}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#2563EB' }}
                      title="Add Action node assigning this role"
                    >
                      <Zap size={11} />
                      <span>+ Assign Role</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid var(--border-light)',
        background: '#FAFBFD',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
      }}>
        <span>{filteredItems.length} items available</span>
        <span style={{ fontStyle: 'italic' }}>Click any item to inject</span>
      </div>
    </div>
  );
};
