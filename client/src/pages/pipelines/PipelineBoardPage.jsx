import React, { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/config-store.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { api } from '../../api/index.js';
import { DynamicForm } from '../../components/forms/DynamicForm.jsx';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  User, 
  Tag, 
  History, 
  X,
  AlertCircle,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Lock,
  Globe,
  RefreshCw,
  Layers
} from 'lucide-react';

export const PipelineBoardPage = () => {
  const { currentPipeline } = useConfigStore();
  const { user } = useAuthStore();

  const [pipelineData, setPipelineData] = useState(null);
  const [stages, setStages] = useState([]);
  const [pipelineFields, setPipelineFields] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);

  // Thread Drawer State
  const [drawerTab, setDrawerTab] = useState('thread'); // 'thread' | 'attributes' | 'stage'
  const [threadTimeline, setThreadTimeline] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadMessageText, setThreadMessageText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingThreadMessage, setIsSendingThreadMessage] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (currentPipeline?.id) {
      loadPipelineBoard(currentPipeline.id);
    }
  }, [currentPipeline?.id]);

  const loadPipelineBoard = async (pipelineId) => {
    setLoading(true);
    try {
      // 1. Fetch full pipeline details (with stages & custom fields)
      const pRes = await api.pipelines.get(pipelineId);
      const data = pRes?.data;
      if (data) {
        setPipelineData(data);
        setStages(data.stages || []);
        setPipelineFields(data.fields || []);
      }

      // 2. Fetch requests for this pipeline
      const reqRes = await api.requests.list({ pipelineId });
      setRequestsList(reqRes?.data || []);
    } catch (err) {
      console.error('Failed to load pipeline board:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (formValues) => {
    try {
      const { title, description, priority, ...customFieldValues } = formValues;
      await api.requests.create({
        pipelineId: currentPipeline.id,
        title: title || `${currentPipeline.name} Submission`,
        description: description || '',
        priority: priority || 'medium',
        customFieldValues,
      });

      setShowCreateModal(false);
      loadPipelineBoard(currentPipeline.id);
    } catch (err) {
      alert(`Could not create request: ${err.message}`);
    }
  };

  const handleAdvanceStage = async (request, targetStageId) => {
    try {
      await api.requests.transition(request.id, {
        targetStageId,
        reason: `Advancement triggered by ${user?.name || 'Advisor'}`,
      });
      loadPipelineBoard(currentPipeline.id);
      if (selectedRequest?.id === request.id) {
        loadRequestDetails(request.id);
        loadRequestThread(request.id);
      }
    } catch (err) {
      alert(err.message || 'Stage transition failed');
    }
  };

  const loadRequestDetails = async (requestId) => {
    try {
      const res = await api.requests.get(requestId);
      setRequestDetails(res?.data);
    } catch (err) {
      console.error('Failed to load request details:', err);
    }
  };

  const loadRequestThread = async (requestId) => {
    setThreadLoading(true);
    setAiSummary(null);
    try {
      const res = await api.threads.getThread(requestId);
      setThreadTimeline(res?.data?.timeline || []);
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleOpenDetails = (req) => {
    setSelectedRequest(req);
    setDrawerTab('thread');
    loadRequestDetails(req.id);
    loadRequestThread(req.id);
  };

  const handleSendThreadMessage = async (e) => {
    if (e) e.preventDefault();
    if (!threadMessageText.trim() || !selectedRequest || isSendingThreadMessage) return;

    setIsSendingThreadMessage(true);
    try {
      await api.threads.postMessage(selectedRequest.id, {
        content: threadMessageText.trim(),
        isInternal: isInternalNote,
      });
      setThreadMessageText('');
      loadRequestThread(selectedRequest.id);
    } catch (err) {
      alert(`Could not send message: ${err.message}`);
    } finally {
      setIsSendingThreadMessage(false);
    }
  };

  const handleAiAssistInDrawer = async (action) => {
    if (!selectedRequest || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await api.threads.aiAssist(selectedRequest.id, { action });
      const suggestion = res?.data?.suggestion;
      if (action === 'summarize') {
        setAiSummary(suggestion);
      } else if (action === 'draft_reply') {
        setIsInternalNote(false);
        setThreadMessageText(suggestion);
      }
    } catch (err) {
      alert(`AI assist error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (!currentPipeline) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '80px 24px', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: '#EFF6FF',
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Layers size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          No pipelines configured
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          Please ask your administrator to create a pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      {/* Board Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-blue">Pipeline Board</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stages.length} Stages Configured</span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {pipelineData?.name || currentPipeline.name}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {pipelineData?.description || 'Manage requests through administrative stages'}
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn btn-primary btn-sm"
        >
          <Plus size={14} />
          <span>New Submission</span>
        </button>
      </div>

      {/* Kanban Stages Board */}
      <div style={{
        display: 'flex',
        gap: '14px',
        overflowX: 'auto',
        paddingBottom: '16px',
        alignItems: 'flex-start',
        minHeight: '600px',
      }}>
        {stages.map((stage, stageIndex) => {
          const stageRequests = requestsList.filter(r => r.stageId === stage.id);
          const nextStage = stages[stageIndex + 1];

          return (
            <div
              key={stage.id}
              style={{
                width: '300px',
                minWidth: '300px',
                background: '#F8FAFC',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 200px)',
              }}
            >
              {/* Stage Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                borderTop: `3px solid ${stage.color || 'var(--accent-primary)'}`,
                borderTopLeftRadius: 'var(--radius-sm)',
                borderTopRightRadius: 'var(--radius-sm)',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {stage.name}
                  </div>
                  {stage.slaHours && (
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <Clock size={11} /> SLA: {stage.slaHours}h
                    </div>
                  )}
                </div>
                <span className="badge badge-gray" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {stageRequests.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflowY: 'auto',
                flex: 1,
              }}>
                {stageRequests.length === 0 ? (
                  <div style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FFFFFF',
                  }}>
                    No records in this stage
                  </div>
                ) : (
                  stageRequests.map(req => (
                    <div
                      key={req.id}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-xs)',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                      onClick={() => handleOpenDetails(req)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {req.requestNumber}
                        </span>
                        <span className={`badge ${req.priority === 'high' ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.625rem' }}>
                          {req.priority || 'medium'}
                        </span>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.4 }}>
                        {req.title}
                      </div>

                      {/* Card Footer with Thread Indicator & Advance */}
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                          <MessageSquare size={12} />
                          <span>Thread</span>
                        </div>
                        {nextStage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceStage(req, nextStage.id);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '2px 8px', gap: '4px' }}
                            title={`Advance to ${nextStage.name}`}
                          >
                            <span>Advance</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Submission Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 28px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Create Request / Application
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pipeline: {pipelineData?.name}
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary btn-icon"
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <DynamicForm
              fields={[
                { name: 'title', label: 'Submission Title / Subject', fieldType: 'text', isRequired: true, placeholder: 'e.g. Liam Chen — Admissions' },
                { name: 'description', label: 'Summary Description', fieldType: 'rich_text', isRequired: false },
                { 
                  name: 'priority', 
                  label: 'Urgency / Priority', 
                  fieldType: 'dropdown', 
                  isRequired: true, 
                  options: [
                    { label: 'Low Priority', value: 'low' },
                    { label: 'Medium Priority', value: 'medium' },
                    { label: 'High Priority', value: 'high' },
                    { label: 'Urgent Expedited', value: 'urgent' },
                  ]
                },
                ...pipelineFields,
              ]}
              onSubmit={handleCreateRequest}
              submitLabel="Submit Record"
            />
          </div>
        </div>
      )}

      {/* Request Details & Threads Drawer */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 90,
        }}
        onClick={() => setSelectedRequest(null)}
        >
          <div 
            style={{
              width: '520px',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-drawer)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderLeft: '1px solid var(--border-subtle)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-blue" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedRequest.requestNumber}
                  </span>
                  <span className={`badge ${selectedRequest.priority === 'high' ? 'badge-rose' : 'badge-amber'}`}>
                    {selectedRequest.priority?.toUpperCase()} PRIORITY
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-secondary btn-icon"
                  style={{ border: 'none', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                {selectedRequest.title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedRequest.description || 'No description provided'}
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => setDrawerTab('thread')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: drawerTab === 'thread' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    background: 'transparent',
                    color: drawerTab === 'thread' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} />
                  <span>Conversation Thread</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab('attributes')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: drawerTab === 'attributes' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    background: 'transparent',
                    color: drawerTab === 'attributes' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={14} />
                  <span>Custom Attributes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab('stage')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: drawerTab === 'stage' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    background: 'transparent',
                    color: drawerTab === 'stage' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <History size={14} />
                  <span>Stage & Progression</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Conversation Thread */}
            {drawerTab === 'thread' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* AI Assistant Quick Actions */}
                <div style={{
                  padding: '10px 20px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)' }}>Friendly Copilot:</span>
                  <button
                    onClick={() => handleAiAssistInDrawer('summarize')}
                    disabled={aiLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '3px 8px', gap: '4px', color: '#7C3AED', borderColor: 'rgba(124, 58, 237, 0.2)' }}
                  >
                    <Sparkles size={11} />
                    <span>Summarize Thread</span>
                  </button>
                  <button
                    onClick={() => handleAiAssistInDrawer('draft_reply')}
                    disabled={aiLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '3px 8px', gap: '4px', color: 'var(--accent-primary)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    <Sparkles size={11} />
                    <span>Draft Friendly Reply</span>
                  </button>
                </div>

                {/* AI Summary Banner */}
                {aiSummary && (
                  <div style={{
                    margin: '12px 20px 0 20px',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: '#F5F3FF',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    fontSize: '0.785rem',
                    color: '#4C1D95',
                    position: 'relative',
                  }}>
                    <button
                      onClick={() => setAiSummary(null)}
                      style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6D28D9' }}
                    >✕</button>
                    <strong>✨ AI Summary & Next Step:</strong>
                    <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{aiSummary}</div>
                  </div>
                )}

                {/* Stream */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {threadLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Loading thread conversation...
                    </div>
                  ) : threadTimeline.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>No messages yet</div>
                      <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>Be the first to post a note or applicant update.</p>
                    </div>
                  ) : (
                    threadTimeline.map(item => {
                      if (item.type === 'status_transition') {
                        return (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                            <div style={{
                              background: '#F1F5F9',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}>
                              <ArrowRight size={10} color="var(--accent-primary)" />
                              <span>{item.authorName} {item.reason}</span>
                            </div>
                          </div>
                        );
                      }

                      const isInternal = item.isInternal;
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '6px',
                            background: isInternal ? '#FFFBEB' : '#FFFFFF',
                            border: isInternal ? '1px solid #FDE68A' : '1px solid var(--border-subtle)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.785rem', color: 'var(--text-main)' }}>
                                {item.authorName}
                              </span>
                              {isInternal ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#FEF3C7', color: '#B45309', fontSize: '0.625rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                                  <Lock size={9} /> Internal Staff Note
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontSize: '0.625rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px' }}>
                                  <Globe size={9} /> Applicant Visible
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                            {item.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Composer */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: isInternalNote ? '#FFFDF5' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '14px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: !isInternalNote ? 'var(--accent-primary)' : '#E2E8F0',
                        color: !isInternalNote ? '#FFFFFF' : 'var(--text-secondary)',
                      }}
                    >
                      Public Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '14px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: isInternalNote ? '#F59E0B' : '#E2E8F0',
                        color: isInternalNote ? '#FFFFFF' : 'var(--text-secondary)',
                      }}
                    >
                      Internal Note
                    </button>
                  </div>

                  <form onSubmit={handleSendThreadMessage} style={{ display: 'flex', gap: '8px' }}>
                    <textarea
                      value={threadMessageText}
                      onChange={(e) => setThreadMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendThreadMessage();
                        }
                      }}
                      placeholder={isInternalNote ? 'Write internal note for staff...' : 'Send friendly reply to applicant...'}
                      className="input"
                      style={{ flex: 1, minHeight: '50px', maxHeight: '100px', fontSize: '0.8rem', padding: '8px 10px', resize: 'none' }}
                    />
                    <button
                      type="submit"
                      disabled={!threadMessageText.trim() || isSendingThreadMessage}
                      className="btn btn-primary"
                      style={{ height: '40px', padding: '0 14px', background: isInternalNote ? '#F59E0B' : 'var(--accent-primary)', borderColor: isInternalNote ? '#F59E0B' : 'var(--accent-primary)' }}
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 2: Custom Attributes */}
            {drawerTab === 'attributes' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="var(--accent-primary)" />
                  <span>Configured Custom Attributes</span>
                </h3>
                {Object.keys(selectedRequest.customFieldValues || {}).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', padding: '20px 0', textAlign: 'center' }}>
                    No custom field attributes set
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(selectedRequest.customFieldValues || {}).map(([k, v]) => (
                      <div key={k} style={{ padding: '10px 14px', borderRadius: '4px', background: '#F8FAFC', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Stage Progression & Audit */}
            {drawerTab === 'stage' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: '#F8FAFC', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Transition Stage
                  </div>
                  <select
                    className="select"
                    value={selectedRequest.stageId || ''}
                    onChange={(e) => handleAdvanceStage(selectedRequest, e.target.value)}
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.id === selectedRequest.stageId ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={15} color="var(--accent-primary)" />
                  <span>Audit History Timeline</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(requestDetails?.history || []).map((h, i) => (
                    <div key={h.id || i} style={{ display: 'flex', gap: '8px', fontSize: '0.785rem' }}>
                      <div style={{ width: '2px', background: 'var(--accent-primary)', position: 'relative' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', position: 'absolute', left: '-2px', top: '4px' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{h.reason || 'Stage Updated'}</div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          By {h.changedByName} • {new Date(h.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
