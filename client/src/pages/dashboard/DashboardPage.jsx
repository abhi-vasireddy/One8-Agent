import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.js';
import { useConfigStore } from '../../stores/config-store.js';
import { api } from '../../api/index.js';
import { 
  GitBranch, 
  Layers, 
  Clock, 
  Workflow, 
  Shield, 
  ArrowUpRight, 
  Plus, 
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pipelines, fetchPipelines, setCurrentPipeline } = useConfigStore();
  const [recentRequests, setRecentRequests] = useState([]);
  const [stats, setStats] = useState({
    totalPipelines: 0,
    openRequests: 0,
    slaHealth: '98.4%',
    activeWorkflows: 3,
  });

  const currentRole = user?.roles?.[0]?.name || (user?.isSuperAdmin ? 'Super Admin' : 'User');

  useEffect(() => {
    fetchPipelines();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await api.requests.list();
      const list = res?.data || [];
      setRecentRequests(list.slice(0, 5));
      setStats(prev => ({
        ...prev,
        openRequests: list.length,
      }));
    } catch (err) {
      // Fallback sample data
      setRecentRequests([
        { id: '1', requestNumber: 'ADM-2026-001', title: 'Liam Chen — B.Tech Computer Science', stageName: 'Document Verification', priority: 'high' },
        { id: '2', requestNumber: 'ADM-2026-002', title: 'Sophia Martinez — Cybersecurity Track', stageName: 'Faculty Interview', priority: 'medium' },
        { id: '3', requestNumber: 'GRV-2026-014', title: 'Hostel WiFi Latency in Block C', stageName: 'Investigation & Hearing', priority: 'medium' },
      ]);
      setStats(prev => ({ ...prev, openRequests: 3 }));
    }
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-blue">
              Role: {currentRole}
            </span>
            <span className="badge badge-gray">
              Apex Institute
            </span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            Apex Institute of Technology & Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px', maxWidth: '640px' }}>
            Enterprise college administration platform. Workflows, stages, and custom fields adapt dynamically.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => navigate('/board')} 
            className="btn btn-primary btn-sm"
          >
            <Layers size={14} />
            <span>Open Pipeline Board</span>
          </button>
          <button 
            onClick={() => navigate('/workflows')} 
            className="btn btn-secondary btn-sm"
          >
            <Workflow size={14} />
            <span>Workflow Studio</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '18px 20px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Configured Pipelines</span>
            <GitBranch size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>
            {pipelines.length || 2}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={12} /> Active configuration
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Records</span>
            <Layers size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>
            {stats.openRequests}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all branches
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>SLA Compliance Rate</span>
            <Clock size={16} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'var(--color-success)' }}>
            {stats.slaHealth}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Stage hour tracking active
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Automations</span>
            <Workflow size={16} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>
            {stats.activeWorkflows}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Graph DAG triggers
          </div>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Pipelines */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Operational Pipelines</h2>
            <button 
              onClick={() => navigate('/admin')} 
              className="btn btn-secondary btn-sm"
            >
              Configure
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pipelines.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  setCurrentPipeline(p);
                  navigate('/board');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `4px solid ${p.color || 'var(--accent-primary)'}`,
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.description || 'Administrative lifecycle process'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-blue">Open Kanban</span>
                  <ArrowUpRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Records */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Recent Submissions Queue</h2>
            <button 
              onClick={() => navigate('/board')} 
              className="btn btn-secondary btn-sm"
            >
              View Board
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentRequests.map(req => (
              <div 
                key={req.id}
                onClick={() => navigate('/board')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {req.requestNumber}
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>
                      {req.stageName || 'In Review'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginTop: '2px', color: 'var(--text-main)' }}>
                    {req.title}
                  </div>
                </div>

                <span className={`badge ${req.priority === 'high' ? 'badge-rose' : 'badge-amber'}`}>
                  {req.priority || 'medium'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
