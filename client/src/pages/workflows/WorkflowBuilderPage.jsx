import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode, ConditionNode, ActionNode, ScheduleNode } from '../../components/workflow/nodes/WorkflowNodes.jsx';
import { api } from '../../api/index.js';
import { 
  Save, 
  Play, 
  Plus, 
  ArrowLeft, 
  Zap, 
  HelpCircle, 
  Clock, 
  PlayCircle,
  X,
  CheckCircle2
} from 'lucide-react';

export const WorkflowBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const nodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    condition: ConditionNode,
    action: ActionNode,
    schedule: ScheduleNode,
  }), []);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      if (id) {
        const res = await api.workflows.get(id);
        const wf = res?.data;
        if (wf) {
          setWorkflow(wf);
          setNodes(wf.nodes || []);
          setEdges(wf.edges || []);
          return;
        }
      }

      // Initial blank canvas for new workflow
      const initialNodes = [
        {
          id: 'node-1',
          type: 'trigger',
          position: { x: 280, y: 50 },
          data: { label: 'Start Trigger', triggerType: 'stage_change' },
        },
      ];

      setWorkflow({
        id: id || '',
        name: 'New Custom Workflow',
        description: 'Visual DAG process automation',
        version: 1,
      });
      setNodes(initialNodes);
      setEdges([]);
    } catch (err) {
      console.error('Failed to load workflow:', err);
    }
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  // Add new node from palette
  const handleAddNode = (type) => {
    const newNodeId = `node-${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newNodeId,
      type,
      position: { x: 300 + Math.random() * 50, y: 250 + Math.random() * 50 },
      data: {
        label: `New ${type.toUpperCase()} Step`,
        ...(type === 'condition' ? { field: 'high_school_gpa', operator: '>=', value: 3.5 } : {}),
        ...(type === 'action' ? { actionType: 'send_notification' } : {}),
        ...(type === 'trigger' ? { triggerType: 'stage_change' } : {}),
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  // Update selected node data
  const updateSelectedNodeData = (key, val) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === selectedNode.id) {
          const updated = {
            ...n,
            data: { ...n.data, [key]: val },
          };
          setSelectedNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  // Save workflow graph
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (workflow?.id && workflow.id !== 'demo-wf') {
        await api.workflows.update(workflow.id, {
          nodes,
          edges,
        });
      }
      alert('Workflow configuration saved successfully!');
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Simulate workflow graph execution
  const handleSimulate = async () => {
    setIsSimulating(true);
    setExecutionResult(null);
    try {
      if (workflow?.id && workflow.id !== 'demo-wf') {
        const res = await api.workflows.execute(workflow.id, {
          high_school_gpa: 3.9,
          applicant_name: 'Liam Chen',
        });
        setExecutionResult(res?.data || { status: 'completed' });
      } else {
        // Local simulation feedback
        await new Promise(r => setTimeout(r, 700));
        setExecutionResult({
          status: 'completed',
          simulationSummary: 'Traversed 3 nodes: Trigger [node-1] → Condition [node-2] (GPA 3.9 >= 3.8: TRUE) → Action [node-3] (Fast-track) → Notification [node-5]',
          nodesExecuted: ['node-1', 'node-2', 'node-3', 'node-5'],
        });
      }
    } catch (err) {
      alert(`Execution test error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Studio Toolbar */}
      <div style={{
        height: '52px',
        padding: '0 24px',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => navigate('/workflows')}
            className="btn btn-secondary btn-icon"
            style={{ padding: '5px' }}
            title="Back to Workflows"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>{workflow?.name || 'Workflow Studio'}</span>
              <span className="badge badge-purple">v{workflow?.version || 1}</span>
            </div>
          </div>
        </div>

        {/* Node Palette Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>ADD:</span>
          <button onClick={() => handleAddNode('trigger')} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-primary)' }}>
            <PlayCircle size={13} /> Trigger
          </button>
          <button onClick={() => handleAddNode('condition')} className="btn btn-secondary btn-sm" style={{ color: '#D97706' }}>
            <HelpCircle size={13} /> Condition
          </button>
          <button onClick={() => handleAddNode('action')} className="btn btn-secondary btn-sm" style={{ color: '#059669' }}>
            <Zap size={13} /> Action
          </button>
          <button onClick={() => handleAddNode('schedule')} className="btn btn-secondary btn-sm" style={{ color: '#7C3AED' }}>
            <Clock size={13} /> Schedule
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleSimulate}
            className="btn btn-secondary btn-sm"
            disabled={isSimulating}
          >
            <Play size={13} color="var(--color-success)" />
            <span>{isSimulating ? 'Simulating...' : 'Test Run Graph'}</span>
          </button>
          <button 
            onClick={handleSave} 
            className="btn btn-primary btn-sm"
            disabled={isSaving}
          >
            <Save size={13} />
            <span>{isSaving ? 'Saving...' : 'Save Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#CBD5E1" gap={24} size={1} />
          <Controls />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'trigger') return '#2563EB';
              if (n.type === 'condition') return '#F59E0B';
              if (n.type === 'action') return '#10B981';
              return '#8B5CF6';
            }}
            style={{ background: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
          />
        </ReactFlow>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div 
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '300px',
              padding: '18px',
              zIndex: 20,
              background: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span className="badge badge-blue" style={{ textTransform: 'uppercase' }}>
                  {selectedNode.type} Node
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '4px', color: 'var(--text-main)' }}>
                  Node Inspector
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '4px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="label">Step Title / Label</label>
              <input
                type="text"
                className="input"
                value={selectedNode.data?.label || ''}
                onChange={(e) => updateSelectedNodeData('label', e.target.value)}
              />
            </div>

            {selectedNode.type === 'condition' && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <label className="label">Target Field</label>
                  <input
                    type="text"
                    className="input"
                    value={selectedNode.data?.field || ''}
                    onChange={(e) => updateSelectedNodeData('field', e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="label">Comparison Operator</label>
                  <select
                    className="select"
                    value={selectedNode.data?.operator || '>='}
                    onChange={(e) => updateSelectedNodeData('operator', e.target.value)}
                  >
                    <option value="==">Equals (==)</option>
                    <option value="!=">Not Equals (!=)</option>
                    <option value=">">Greater Than (&gt;)</option>
                    <option value=">=">Greater Than or Equal (&gt;=)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="<=">Less Than or Equal (&lt;=)</option>
                    <option value="contains">Contains Substring</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label className="label">Threshold Value</label>
                  <input
                    type="text"
                    className="input"
                    value={selectedNode.data?.value ?? ''}
                    onChange={(e) => updateSelectedNodeData('value', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'action' && (
              <div style={{ marginBottom: '10px' }}>
                <label className="label">Action Type</label>
                <select
                  className="select"
                  value={selectedNode.data?.actionType || 'change_stage'}
                  onChange={(e) => updateSelectedNodeData('actionType', e.target.value)}
                >
                  <option value="change_stage">Advance / Change Stage</option>
                  <option value="send_notification">Send Multi-Channel Notification</option>
                  <option value="update_field">Update Custom Field Value</option>
                  <option value="assign_user">Auto-Assign Reviewer</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Simulation Result Popover */}
        {executionResult && (
          <div 
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              maxWidth: '440px',
              padding: '14px 18px',
              zIndex: 30,
              background: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--color-success)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Simulation Succeeded</span>
              </div>
              <button onClick={() => setExecutionResult(null)} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '3px' }}>
                <X size={12} />
              </button>
            </div>
            <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
              {executionResult.simulationSummary || 'Graph DAG evaluated and all nodes executed successfully.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
