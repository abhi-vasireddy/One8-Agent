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
import { WorkflowFieldFinder, SYSTEM_FIELDS } from '../../components/workflow/WorkflowFieldFinder.jsx';
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
  CheckCircle2,
  Search,
  Layers,
  Sliders,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronDown
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

  // Pipeline, Stages, Fields, and Roles context
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [stages, setStages] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // UI Drawer states: 'inspector' | 'explorer'
  const [activeSidePanel, setActiveSidePanel] = useState('explorer'); // default open explorer if no node selected
  const [showSidePanel, setShowSidePanel] = useState(true);

  // Inline filter queries for inspector drawers
  const [inspectorStageFilter, setInspectorStageFilter] = useState('');
  const [inspectorFieldFilter, setInspectorFieldFilter] = useState('');
  const [inspectorRoleFilter, setInspectorRoleFilter] = useState('');

  const nodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    condition: ConditionNode,
    action: ActionNode,
    schedule: ScheduleNode,
  }), []);

  // Fetch initial workflow & pipeline context
  useEffect(() => {
    initPageData();
  }, [id]);

  const initPageData = async () => {
    setLoadingContext(true);
    try {
      // 1. Fetch available pipelines
      const pipesRes = await api.pipelines.list();
      const loadedPipelines = pipesRes?.data || [];
      setPipelines(loadedPipelines);

      // 2. Fetch roles
      try {
        const rolesRes = await api.roles.list();
        setRoles(rolesRes?.data || []);
      } catch (rErr) {
        console.warn('Roles fetch fallback:', rErr);
      }

      // 3. Fetch custom fields
      try {
        const fieldsRes = await api.fields.list();
        setCustomFields(fieldsRes?.data || []);
      } catch (fErr) {
        console.warn('Fields fetch fallback:', fErr);
      }

      // 4. Load or create workflow graph
      let currentWf = null;
      let targetPipeId = '';

      if (id && id !== 'new') {
        const wfRes = await api.workflows.get(id);
        currentWf = wfRes?.data;
      }

      if (currentWf) {
        setWorkflow(currentWf);
        setNodes(currentWf.nodes || []);
        setEdges(currentWf.edges || []);
        targetPipeId = currentWf.pipelineId || currentWf.pipeline_id || (loadedPipelines[0]?.id || '');
      } else {
        // Initial blank template
        targetPipeId = loadedPipelines[0]?.id || '';
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
          pipelineId: targetPipeId,
          version: 1,
        });
        setNodes(initialNodes);
        setEdges([]);
      }

      setSelectedPipelineId(targetPipeId);

      // 5. Load stages for current pipeline
      if (targetPipeId) {
        await loadStagesForPipeline(targetPipeId);
      }
    } catch (err) {
      console.error('Failed to initialize workflow studio:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  const loadStagesForPipeline = async (pipeId) => {
    if (!pipeId) {
      setStages([]);
      return;
    }
    try {
      const stagesRes = await api.stages.listForPipeline(pipeId);
      const stageList = stagesRes?.data || [];
      setStages(stageList);
    } catch (sErr) {
      console.warn('Stages load error:', sErr);
      setStages([]);
    }
  };

  // Pipeline switcher handler
  const handlePipelineChange = async (newPipeId) => {
    setSelectedPipelineId(newPipeId);
    setWorkflow(prev => prev ? { ...prev, pipelineId: newPipeId } : prev);
    await loadStagesForPipeline(newPipeId);
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
    setActiveSidePanel('inspector');
    setShowSidePanel(true);
  };

  // Add new node from palette
  const handleAddNode = (type) => {
    const newNodeId = `node-${Date.now().toString().slice(-4)}`;
    const defaultStage = stages[0];
    const defaultField = customFields[0]?.name || 'priority';

    const newNode = {
      id: newNodeId,
      type,
      position: { x: 280 + Math.random() * 60, y: 220 + Math.random() * 60 },
      data: {
        label: `New ${type.toUpperCase()} Step`,
        ...(type === 'condition' ? { field: defaultField, operator: '==', value: '' } : {}),
        ...(type === 'action' ? { 
          actionType: 'change_stage', 
          targetStageId: defaultStage?.id || '',
          targetStageName: defaultStage?.name || '',
          targetStageColor: defaultStage?.color || '#6366f1'
        } : {}),
        ...(type === 'trigger' ? { 
          triggerType: 'stage_change', 
          targetStageId: defaultStage?.id || '',
          targetStageName: defaultStage?.name || '',
          targetStageColor: defaultStage?.color || '#6366f1'
        } : {}),
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    setActiveSidePanel('inspector');
    setShowSidePanel(true);
  };

  // Update selected node data single key
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

  // Update multiple node data fields at once
  const updateMultipleNodeData = (patch) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === selectedNode.id) {
          const updated = {
            ...n,
            data: { ...n.data, ...patch },
          };
          setSelectedNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  // Handle selection from Explorer
  const handleExplorerSelect = (item, category) => {
    if (!selectedNode) {
      // If no node selected, auto-create a suitable node
      if (category === 'stages') {
        handleAddNodeWithPreset('action', {
          label: `Move to ${item.name}`,
          actionType: 'change_stage',
          targetStageId: item.id,
          targetStageName: item.name,
          targetStageColor: item.color,
        });
      } else if (category === 'fields' || category === 'system') {
        handleAddNodeWithPreset('condition', {
          label: `Check ${item.label}`,
          field: item.name,
          operator: '==',
          value: '',
        });
      } else if (category === 'roles') {
        handleAddNodeWithPreset('action', {
          label: `Assign to ${item.name}`,
          actionType: 'assign_role',
          roleName: item.name,
          assignedRoleId: item.id,
        });
      }
      return;
    }

    // Apply to selected node
    if (category === 'stages') {
      if (selectedNode.type === 'action') {
        updateMultipleNodeData({
          actionType: 'change_stage',
          targetStageId: item.id,
          targetStageName: item.name,
          targetStageColor: item.color,
          label: `Move to ${item.name}`,
        });
      } else if (selectedNode.type === 'trigger') {
        updateMultipleNodeData({
          triggerType: 'stage_change',
          targetStageId: item.id,
          targetStageName: item.name,
          targetStageColor: item.color,
          label: `On Entering ${item.name}`,
        });
      } else if (selectedNode.type === 'condition') {
        updateMultipleNodeData({
          field: 'stage_id',
          operator: '==',
          value: item.id,
          label: `If Stage == ${item.name}`,
        });
      }
    } else if (category === 'fields' || category === 'system') {
      if (selectedNode.type === 'condition') {
        updateMultipleNodeData({
          field: item.name,
          label: `Check ${item.label}`,
        });
      } else if (selectedNode.type === 'action') {
        updateMultipleNodeData({
          actionType: 'update_field',
          field: item.name,
          label: `Update ${item.label}`,
        });
      }
    } else if (category === 'roles') {
      if (selectedNode.type === 'action') {
        updateMultipleNodeData({
          actionType: 'assign_role',
          roleName: item.name,
          assignedRoleId: item.id,
          label: `Assign to ${item.name}`,
        });
      }
    }
  };

  // Add node with preset data
  const handleAddNodeWithPreset = (type, presetData) => {
    const newNodeId = `node-${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newNodeId,
      type,
      position: { x: 300 + Math.random() * 50, y: 220 + Math.random() * 50 },
      data: {
        label: presetData.label || `New ${type.toUpperCase()} Step`,
        ...presetData,
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    setActiveSidePanel('inspector');
    setShowSidePanel(true);
  };

  // Save workflow graph
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (workflow?.id && workflow.id !== 'demo-wf') {
        await api.workflows.update(workflow.id, {
          name: workflow.name,
          pipelineId: selectedPipelineId || null,
          nodes,
          edges,
        });
      } else {
        const created = await api.workflows.create({
          name: workflow?.name || 'New Custom Workflow',
          pipelineId: selectedPipelineId || null,
          triggerType: nodes[0]?.data?.triggerType || 'stage_change',
          nodes,
          edges,
        });
        if (created?.data?.id) {
          navigate(`/workflows/${created.data.id}`, { replace: true });
        }
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
          priority: 'high',
          customFieldValues: { candidate_details: 'Simulated Candidate Record' },
        });
        setExecutionResult(res?.data || { status: 'completed' });
      } else {
        await new Promise(r => setTimeout(r, 600));
        setExecutionResult({
          status: 'completed',
          simulationSummary: `Simulated graph traversal across ${nodes.length} nodes successfully on pipeline "${currentPipelineName}".`,
          nodesExecuted: nodes.map(n => n.id),
        });
      }
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const currentPipelineName = useMemo(() => {
    const found = pipelines.find(p => p.id === selectedPipelineId);
    return found ? found.name : 'All Pipelines';
  }, [pipelines, selectedPipelineId]);

  // Inspector filtered options
  const inspectorFilteredStages = useMemo(() => {
    const q = inspectorStageFilter.trim().toLowerCase();
    if (!q) return stages;
    return stages.filter(s => s.name?.toLowerCase().includes(q));
  }, [stages, inspectorStageFilter]);

  const inspectorFilteredFields = useMemo(() => {
    const q = inspectorFieldFilter.trim().toLowerCase();
    const all = [
      ...customFields.map(f => ({ ...f, isCustom: true })),
      ...SYSTEM_FIELDS.map(f => ({ ...f, isCustom: false }))
    ];
    if (!q) return all;
    return all.filter(f => (f.label || f.name).toLowerCase().includes(q));
  }, [customFields, inspectorFieldFilter]);

  const inspectorFilteredRoles = useMemo(() => {
    const q = inspectorRoleFilter.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r => r.name?.toLowerCase().includes(q));
  }, [roles, inspectorRoleFilter]);

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Studio Header Toolbar */}
      <div style={{
        height: '54px',
        padding: '0 20px',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        {/* Left: Navigation and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => navigate('/workflows')}
            className="btn btn-secondary btn-icon"
            style={{ padding: '6px' }}
            title="Back to Workflows"
          >
            <ArrowLeft size={15} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
              {workflow?.name || 'Workflow Studio'}
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>
              v{workflow?.version || 1}
            </span>
          </div>

          {/* Pipeline Context Selector */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginLeft: '12px',
            paddingLeft: '14px',
            borderLeft: '1px solid var(--border-light)' 
          }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              PIPELINE:
            </span>
            <select
              className="select"
              value={selectedPipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
              style={{
                fontSize: '0.785rem',
                height: '30px',
                padding: '2px 24px 2px 8px',
                maxWidth: '240px',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="badge badge-blue" style={{ fontSize: '0.675rem' }}>
              {stages.length} States
            </span>
          </div>
        </div>

        {/* Center: Node Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '2px' }}>
            ADD:
          </span>
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

        {/* Right: Explorer Toggle & Save Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Reactive Variable & State Finder Toggle */}
          <button
            onClick={() => {
              if (showSidePanel && activeSidePanel === 'explorer') {
                setShowSidePanel(false);
              } else {
                setActiveSidePanel('explorer');
                setShowSidePanel(true);
              }
            }}
            className={`btn btn-sm ${showSidePanel && activeSidePanel === 'explorer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '6px' }}
            title="Toggle Variables & States Explorer"
          >
            <Search size={13} />
            <span>Fields & States</span>
            <span style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: '8px',
              background: (showSidePanel && activeSidePanel === 'explorer') ? '#FFFFFF30' : '#F1F5F9',
              color: (showSidePanel && activeSidePanel === 'explorer') ? '#FFFFFF' : 'var(--text-dim)',
              fontWeight: 700,
            }}>
              {stages.length + customFields.length}
            </span>
          </button>

          <button 
            onClick={handleSimulate}
            className="btn btn-secondary btn-sm"
            disabled={isSimulating}
          >
            <Play size={13} color="var(--color-success)" />
            <span>{isSimulating ? 'Simulating...' : 'Test Run'}</span>
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

      {/* Main Canvas + Side Panel Workspace */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Canvas Area */}
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

          {/* Simulation Output Popover */}
          {executionResult && (
            <div 
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                maxWidth: '460px',
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

        {/* Right Docked Panel (Inspector OR Fields & States Explorer) */}
        {showSidePanel && (
          <div style={{
            width: '350px',
            borderLeft: '1px solid var(--border-subtle)',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20,
            boxShadow: 'var(--shadow-drawer)',
          }}>
            {/* Panel Mode Switcher Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              background: '#FAFBFD',
            }}>
              {selectedNode && (
                <button
                  onClick={() => setActiveSidePanel('inspector')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '0.785rem',
                    fontWeight: activeSidePanel === 'inspector' ? 700 : 500,
                    color: activeSidePanel === 'inspector' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: activeSidePanel === 'inspector' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⚙️ Node Inspector</span>
                </button>
              )}
              
              <button
                onClick={() => setActiveSidePanel('explorer')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '0.785rem',
                  fontWeight: activeSidePanel === 'explorer' ? 700 : 500,
                  color: activeSidePanel === 'explorer' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderBottom: activeSidePanel === 'explorer' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Search size={13} />
                <span>States & Fields</span>
              </button>

              <button
                onClick={() => setShowSidePanel(false)}
                className="btn btn-secondary btn-icon"
                style={{ border: 'none', padding: '6px', marginRight: '6px', background: 'transparent' }}
                title="Collapse Panel"
              >
                <X size={14} />
              </button>
            </div>

            {/* PANEL CONTENT 1: Node Inspector */}
            {activeSidePanel === 'inspector' && selectedNode && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <span className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: '0.675rem' }}>
                      {selectedNode.type} Node
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '4px', color: 'var(--text-main)' }}>
                      Step Settings
                    </div>
                  </div>
                </div>

                {/* Step Title */}
                <div style={{ marginBottom: '14px' }}>
                  <label className="label">Step Title / Label</label>
                  <input
                    type="text"
                    className="input"
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => updateSelectedNodeData('label', e.target.value)}
                  />
                </div>

                {/* ────────────────── TRIGGER NODE SETTINGS ────────────────── */}
                {selectedNode.type === 'trigger' && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label className="label">Trigger Event Type</label>
                      <select
                        className="select"
                        value={selectedNode.data?.triggerType || 'stage_change'}
                        onChange={(e) => updateSelectedNodeData('triggerType', e.target.value)}
                      >
                        <option value="stage_change">Stage Entry / State Change</option>
                        <option value="request_created">New Request Submission</option>
                        <option value="scheduled">Scheduled Timer</option>
                      </select>
                    </div>

                    {selectedNode.data?.triggerType === 'stage_change' && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label className="label" style={{ marginBottom: 0 }}>Target State (Stage)</label>
                          <button
                            type="button"
                            onClick={() => setActiveSidePanel('explorer')}
                            style={{ fontSize: '0.685rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Search size={11} /> Find in Stages
                          </button>
                        </div>

                        {/* Searchable Stage Dropdown */}
                        <select
                          className="select"
                          value={selectedNode.data?.targetStageId || ''}
                          onChange={(e) => {
                            const found = stages.find(s => s.id === e.target.value);
                            updateMultipleNodeData({
                              targetStageId: e.target.value,
                              targetStageName: found?.name || '',
                              targetStageColor: found?.color || '#6366f1',
                              label: found ? `On Entering ${found.name}` : selectedNode.data?.label,
                            });
                          }}
                        >
                          <option value="">-- Choose Pipeline State --</option>
                          {stages.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.isInitial ? 'Initial' : s.isFinal ? 'Final' : `Step #${s.order}`})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* ────────────────── CONDITION NODE SETTINGS ────────────────── */}
                {selectedNode.type === 'condition' && (
                  <>
                    {/* Target Field Searchable Selector */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="label" style={{ marginBottom: 0 }}>Target Field to Evaluate</label>
                        <button
                          type="button"
                          onClick={() => setActiveSidePanel('explorer')}
                          style={{ fontSize: '0.685rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Search size={11} /> Search Fields
                        </button>
                      </div>

                      {/* Filter Search inside Inspector */}
                      <input
                        type="text"
                        className="input"
                        placeholder="Search field by name..."
                        value={inspectorFieldFilter}
                        onChange={(e) => setInspectorFieldFilter(e.target.value)}
                        style={{ height: '28px', fontSize: '0.75rem', marginBottom: '6px' }}
                      />

                      <select
                        className="select"
                        value={selectedNode.data?.field || ''}
                        onChange={(e) => {
                          const chosen = inspectorFilteredFields.find(f => f.name === e.target.value);
                          updateMultipleNodeData({
                            field: e.target.value,
                            label: chosen ? `Check ${chosen.label}` : selectedNode.data?.label,
                          });
                        }}
                      >
                        <option value="">-- Select Field from Pipeline --</option>
                        <optgroup label="Pipeline Custom Fields">
                          {inspectorFilteredFields.filter(f => f.isCustom).map(f => (
                            <option key={f.id} value={f.name}>
                              {f.label} ({f.name})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="System Properties">
                          {inspectorFilteredFields.filter(f => !f.isCustom).map(f => (
                            <option key={f.id} value={f.name}>
                              {f.label} ({f.name})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label className="label">Comparison Operator</label>
                      <select
                        className="select"
                        value={selectedNode.data?.operator || '=='}
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

                    <div style={{ marginBottom: '14px' }}>
                      <label className="label">Expected Threshold / Value</label>
                      <input
                        type="text"
                        className="input"
                        value={selectedNode.data?.value ?? ''}
                        placeholder="e.g. 3.5, true, Approved, etc."
                        onChange={(e) => updateSelectedNodeData('value', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* ────────────────── ACTION NODE SETTINGS ────────────────── */}
                {selectedNode.type === 'action' && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label className="label">Action Type</label>
                      <select
                        className="select"
                        value={selectedNode.data?.actionType || 'change_stage'}
                        onChange={(e) => updateSelectedNodeData('actionType', e.target.value)}
                      >
                        <option value="change_stage">Advance / Change Stage</option>
                        <option value="assign_role">Assign to Management Role</option>
                        <option value="update_field">Update Custom Field Value</option>
                        <option value="send_notification">Send Multi-Channel Notification</option>
                        <option value="create_internal_note">Create Internal Note</option>
                      </select>
                    </div>

                    {/* Stage Picker for change_stage */}
                    {selectedNode.data?.actionType === 'change_stage' && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label className="label" style={{ marginBottom: 0 }}>Target State (Stage)</label>
                          <button
                            type="button"
                            onClick={() => setActiveSidePanel('explorer')}
                            style={{ fontSize: '0.685rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Search size={11} /> Find in Stages
                          </button>
                        </div>

                        {/* Search input for stages */}
                        <input
                          type="text"
                          className="input"
                          placeholder="Filter stages..."
                          value={inspectorStageFilter}
                          onChange={(e) => setInspectorStageFilter(e.target.value)}
                          style={{ height: '28px', fontSize: '0.75rem', marginBottom: '6px' }}
                        />

                        {/* Stage selection list with color dots */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          padding: '4px',
                        }}>
                          {inspectorFilteredStages.map(s => {
                            const isSelected = selectedNode.data?.targetStageId === s.id;
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  updateMultipleNodeData({
                                    targetStageId: s.id,
                                    targetStageName: s.name,
                                    targetStageColor: s.color,
                                    label: `Move to ${s.name}`,
                                  });
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  background: isSelected ? '#EFF6FF' : 'transparent',
                                  border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent',
                                  transition: 'background 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color || '#6366f1' }} />
                                  <span style={{ fontSize: '0.785rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                    {s.name}
                                  </span>
                                </div>
                                {isSelected && <Check size={13} color="var(--accent-primary)" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Role Picker for assign_role */}
                    {selectedNode.data?.actionType === 'assign_role' && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label className="label" style={{ marginBottom: 0 }}>Target Role</label>
                          <button
                            type="button"
                            onClick={() => setActiveSidePanel('explorer')}
                            style={{ fontSize: '0.685rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Search size={11} /> Find in Roles
                          </button>
                        </div>

                        <select
                          className="select"
                          value={selectedNode.data?.roleName || ''}
                          onChange={(e) => {
                            const r = roles.find(item => item.name === e.target.value);
                            updateMultipleNodeData({
                              roleName: e.target.value,
                              assignedRoleId: r?.id || null,
                              label: `Assign to ${e.target.value}`,
                            });
                          }}
                        >
                          <option value="">-- Choose Role --</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Field Picker for update_field */}
                    {selectedNode.data?.actionType === 'update_field' && (
                      <>
                        <div style={{ marginBottom: '14px' }}>
                          <label className="label">Custom Field to Update</label>
                          <select
                            className="select"
                            value={selectedNode.data?.field || ''}
                            onChange={(e) => updateSelectedNodeData('field', e.target.value)}
                          >
                            <option value="">-- Choose Custom Field --</option>
                            {customFields.map(f => (
                              <option key={f.id} value={f.name}>{f.label} ({f.name})</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                          <label className="label">New Value</label>
                          <input
                            type="text"
                            className="input"
                            value={selectedNode.data?.value ?? ''}
                            onChange={(e) => updateSelectedNodeData('value', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Internal Note Content */}
                    {selectedNode.data?.actionType === 'create_internal_note' && (
                      <div style={{ marginBottom: '14px' }}>
                        <label className="label">Internal Note Template</label>
                        <textarea
                          className="input"
                          rows={3}
                          value={selectedNode.data?.content || ''}
                          placeholder="e.g. Automated triaging note. Assigned to {{role_name}}."
                          onChange={(e) => updateSelectedNodeData('content', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Quick Explorer Link at bottom of inspector */}
                <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    onClick={() => setActiveSidePanel('explorer')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
                  >
                    <Search size={13} />
                    <span>Browse Pipeline Variables & States</span>
                  </button>
                </div>
              </div>
            )}

            {/* PANEL CONTENT 2: Variables & States Explorer (WorkflowFieldFinder) */}
            {activeSidePanel === 'explorer' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <WorkflowFieldFinder
                  stages={stages}
                  fields={customFields}
                  roles={roles}
                  pipelineName={currentPipelineName}
                  selectedNode={selectedNode}
                  onSelect={handleExplorerSelect}
                  onAddNode={handleAddNodeWithPreset}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
