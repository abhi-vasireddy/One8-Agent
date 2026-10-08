import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/index.js';
import { Workflow, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';

export const WorkflowsListPage = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.workflows.list();
      setWorkflows(res?.data || []);
    } catch (err) {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await api.workflows.create({
        name: 'New Custom Process Automation',
        description: 'Visual DAG workflow',
        triggerType: 'stage_change',
        nodes: [
          { id: 'node-1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Start Trigger' } },
        ],
        edges: [],
      });
      if (res?.data?.id) {
        navigate(`/workflows/${res.data.id}`);
      } else {
        navigate('/workflows/demo-wf');
      }
    } catch (err) {
      navigate('/workflows/demo-wf');
    }
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-blue">Automation Engine</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Whimsical-style Node Canvas</span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            Workflow Graph Automations
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configure event-driven and scheduled automation DAGs without touching backend code.
          </p>
        </div>

        <button onClick={handleCreateNew} className="btn btn-primary btn-sm">
          <Plus size={14} />
          <span>New Workflow Canvas</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading workflows...
        </div>
      ) : workflows.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center', background: '#FFFFFF', maxWidth: '520px', margin: '40px auto' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Workflow size={26} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            No workflows configured
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 18px 0' }}>
            Automate your first process.
          </p>
          <button onClick={handleCreateNew} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Plus size={14} />
            <span>+ Create Workflow</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {workflows.map(wf => (
            <div 
              key={wf.id}
              style={{
                padding: '20px',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                    {wf.triggerType?.replace(/_/g, ' ') || 'Event Trigger'}
                  </span>
                  <span className="badge badge-green">
                    <CheckCircle2 size={11} /> Active
                  </span>
                </div>

                <h2 style={{ fontSize: '0.975rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  {wf.name}
                </h2>
                <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {wf.description}
                </p>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                  {Array.isArray(wf.nodes) ? wf.nodes.length : 4} nodes • v{wf.version || 1}
                </span>
                <button 
                  onClick={() => navigate(`/workflows/${wf.id}`)}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Open Studio</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
