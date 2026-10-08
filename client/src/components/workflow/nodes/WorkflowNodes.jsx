import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PlayCircle, HelpCircle, Zap, Clock } from 'lucide-react';

export const TriggerNode = memo(({ data, selected }) => {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      background: '#FFFFFF',
      border: selected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
      borderLeft: '4px solid var(--accent-primary)',
      boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      minWidth: '230px',
      color: 'var(--text-main)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <PlayCircle size={14} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
          TRIGGER NODE
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{data.label || 'Trigger Event'}</div>
      {data.targetStageName && (
        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ 
            fontSize: '0.675rem', 
            fontWeight: 600, 
            padding: '2px 8px', 
            borderRadius: '10px', 
            background: data.targetStageColor ? `${data.targetStageColor}18` : '#EFF6FF',
            color: data.targetStageColor || '#2563EB',
            border: `1px solid ${data.targetStageColor ? `${data.targetStageColor}40` : '#BFDBFE'}`
          }}>
            📍 Stage: {data.targetStageName}
          </span>
        </div>
      )}
      {data.triggerType && !data.targetStageName && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Event: {data.triggerType}
        </div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent-primary)', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />
    </div>
  );
});

export const ConditionNode = memo(({ data, selected }) => {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      background: '#FFFFFF',
      border: selected ? '2px solid #F59E0B' : '1px solid var(--border-subtle)',
      borderLeft: '4px solid #F59E0B',
      boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      minWidth: '240px',
      color: 'var(--text-main)',
    }}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} style={{ background: '#F59E0B', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <HelpCircle size={14} color="#F59E0B" />
        <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: '#B45309', letterSpacing: '0.04em' }}>
          DECISION / CONDITION
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{data.label || 'Condition Check'}</div>
      {data.field ? (
        <div style={{ 
          fontSize: '0.7rem', 
          color: '#1E293B', 
          marginTop: '6px', 
          fontFamily: 'var(--font-mono)',
          background: '#F8FAFC',
          padding: '3px 6px',
          borderRadius: '4px',
          border: '1px solid #E2E8F0',
          display: 'inline-block'
        }}>
          {data.field} <span style={{ color: '#D97706', fontWeight: 700 }}>{data.operator || '=='}</span> {String(data.value ?? "''")}
        </div>
      ) : (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>
          Select target field to evaluate
        </div>
      )}

      {/* Output Handles for True and False branches */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '6px', borderTop: '1px solid var(--border-light)', fontSize: '0.675rem', fontWeight: 600 }}>
        <span style={{ color: 'var(--color-success)' }}>TRUE (Yes)</span>
        <span style={{ color: 'var(--color-warning)' }}>FALSE (No)</span>
      </div>

      <Handle id="true" type="source" position={Position.Bottom} style={{ left: '25%', background: '#10B981', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: '75%', background: '#F59E0B', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />
    </div>
  );
});

export const ActionNode = memo(({ data, selected }) => {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      background: '#FFFFFF',
      border: selected ? '2px solid #10B981' : '1px solid var(--border-subtle)',
      borderLeft: '4px solid #10B981',
      boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      minWidth: '230px',
      color: 'var(--text-main)',
    }}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} style={{ background: '#10B981', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Zap size={14} color="#10B981" />
        <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.04em' }}>
          AUTOMATION ACTION
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{data.label || 'Action Step'}</div>
      
      {/* Action Specific Badges */}
      {data.actionType === 'change_stage' && (
        <div style={{ marginTop: '5px' }}>
          <span style={{ 
            fontSize: '0.675rem', 
            fontWeight: 600, 
            padding: '2px 8px', 
            borderRadius: '10px', 
            background: data.targetStageColor ? `${data.targetStageColor}18` : '#ECFDF5',
            color: data.targetStageColor || '#059669',
            border: `1px solid ${data.targetStageColor ? `${data.targetStageColor}40` : '#A7F3D0'}`
          }}>
            ➡️ Move to: {data.targetStageName || data.targetStageId || 'Select Stage'}
          </span>
        </div>
      )}

      {data.actionType === 'assign_role' && (
        <div style={{ marginTop: '5px' }}>
          <span style={{ 
            fontSize: '0.675rem', 
            fontWeight: 600, 
            padding: '2px 8px', 
            borderRadius: '10px', 
            background: '#F0F9FF',
            color: '#0284C7',
            border: '1px solid #BAE6FD'
          }}>
            👤 Assign: {data.roleName || 'Select Role'}
          </span>
        </div>
      )}

      {data.actionType === 'update_field' && (
        <div style={{ marginTop: '5px' }}>
          <span style={{ 
            fontSize: '0.675rem', 
            fontWeight: 600, 
            padding: '2px 8px', 
            borderRadius: '10px', 
            background: '#F5F3FF',
            color: '#7C3AED',
            border: '1px solid #DDD6FE'
          }}>
            ✏️ Field: {data.field || 'Select Field'}
          </span>
        </div>
      )}

      {data.actionType && !['change_stage', 'assign_role', 'update_field'].includes(data.actionType) && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Action: {data.actionType}
        </div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#10B981', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />
    </div>
  );
});

export const ScheduleNode = memo(({ data, selected }) => {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      background: '#FFFFFF',
      border: selected ? '2px solid #8B5CF6' : '1px solid var(--border-subtle)',
      borderLeft: '4px solid #8B5CF6',
      boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      minWidth: '200px',
      color: 'var(--text-main)',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#8B5CF6', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Clock size={14} color="#8B5CF6" />
        <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: '#6D28D9', letterSpacing: '0.04em' }}>
          SCHEDULE / DELAY
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{data.label || 'Delay Timer'}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#8B5CF6', width: '8px', height: '8px', border: '2px solid #FFFFFF' }} />
    </div>
  );
});
