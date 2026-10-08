import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store.js';
import { useConfigStore } from '../../stores/config-store.js';
import { api } from '../../api/index.js';
import { 
  FileText, 
  Send, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  Sparkles, 
  User, 
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const StudentAgentPage = () => {
  const { user } = useAuthStore();
  const { pipelines, fetchNotifications } = useConfigStore();

  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [threadData, setThreadData] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New application modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [pipelineFields, setPipelineFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // AI chat state inside student portal
  const [aiMessage, setAiMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    { sender: 'ai', text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am CampusFlow AI. I can answer questions about your applications, explain stage requirements, or help you submit new requests.` }
  ]);
  const [aiThinking, setAiThinking] = useState(false);

  // Load student's own requests
  const loadMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.requests.list();
      const list = res?.data || [];
      setMyRequests(list);
      if (list.length > 0 && !selectedRequest) {
        selectRequest(list[0]);
      }
    } catch (err) {
      console.warn('Failed to load student requests:', err.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const selectRequest = async (req) => {
    setSelectedRequest(req);
    setLoadingThread(true);
    try {
      const res = await api.threads.getThread(req.id);
      setThreadData(res?.data || null);
    } catch (err) {
      console.warn('Failed to load thread:', err.message);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines]);

  // When pipeline changes in apply modal, load custom fields
  useEffect(() => {
    if (selectedPipelineId) {
      api.fields.list().then((res) => {
        const fields = res?.data || [];
        setPipelineFields(fields);
      }).catch(() => setPipelineFields([]));
    }
  }, [selectedPipelineId]);

  const handlePostStudentReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedRequest) return;
    setSendingReply(true);
    try {
      await api.threads.postMessage(selectedRequest.id, {
        content: replyContent.trim(),
        isInternal: false,
      });
      setReplyContent('');
      // Reload thread
      selectRequest(selectedRequest);
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!appTitle.trim()) {
      setSubmitError('Please enter a title for your application.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        pipelineId: selectedPipelineId,
        title: appTitle.trim(),
        description: appDescription.trim(),
        priority: 'medium',
        customFieldValues: fieldValues,
      };
      const res = await api.requests.create(payload);
      if (res?.data) {
        setShowApplyModal(false);
        setAppTitle('');
        setAppDescription('');
        setFieldValues({});
        await loadMyRequests();
        fetchNotifications();
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    const userMsg = aiMessage.trim();
    setAiChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiMessage('');
    setAiThinking(true);
    try {
      const res = await api.ai.chat(userMsg, aiChatHistory.map(h => ({ sender: h.sender, content: h.text })));
      const reply = res?.data?.reply || 'I am looking into that for you.';
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: 'Error contacting AI: ' + err.message }]);
    } finally {
      setAiThinking(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1300px',
      margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Portal Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Student Workspace & Self-Service
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Welcome, <strong>{user?.name || 'Student'}</strong>. Track your submissions, correspond with advisors, and request institutional services.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="btn btn-primary"
          style={{ gap: '8px', padding: '9px 16px', fontSize: '0.85rem' }}
        >
          <PlusCircle size={16} />
          <span>New Application</span>
        </button>
      </div>

      {/* Main Grid: Left = Applications List, Center = Live Thread & Status, Right = AI Assistant */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: My Applications */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              My Submissions ({myRequests.length})
            </span>
            <button 
              onClick={loadMyRequests} 
              className="btn btn-secondary btn-icon" 
              style={{ width: '28px', height: '28px', padding: 0 }}
              title="Refresh submissions"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Loading your records...
            </div>
          ) : myRequests.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <p>No active applications found.</p>
              <button 
                onClick={() => setShowApplyModal(true)} 
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
              >
                Submit First Request
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => selectRequest(req)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                      background: isSelected ? 'var(--accent-light)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {req.requestNumber}
                      </span>
                      <span className="badge badge-blue" style={{ fontSize: '0.675rem' }}>
                        {req.stageName || 'In Review'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {req.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center Column: Thread & Status Progression */}
        <div className="card" style={{ padding: '20px', minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
          {selectedRequest ? (
            <>
              {/* Request Header */}
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {selectedRequest.requestNumber} • {selectedRequest.pipelineName}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                  }}>
                    Current Stage: {selectedRequest.stageName}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 4px 0' }}>
                  {selectedRequest.title}
                </h2>
                {selectedRequest.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    {selectedRequest.description}
                  </p>
                )}
              </div>

              {/* Thread Messages */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {loadingThread ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Loading correspondence...
                  </div>
                ) : (threadData?.messages || []).filter(m => !m.metadata?.isInternal).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No correspondence posted yet.
                  </div>
                ) : (
                  (threadData?.messages || []).filter(m => !m.metadata?.isInternal).map((msg) => {
                    const isStudent = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isStudent ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: isStudent ? 'var(--accent-primary)' : '#F1F5F9',
                          color: isStudent ? '#FFFFFF' : '#1E293B',
                          fontSize: '0.825rem',
                          lineHeight: 1.45,
                        }}
                      >
                        <div style={{
                          fontSize: '0.675rem',
                          fontWeight: 600,
                          marginBottom: '3px',
                          opacity: 0.85,
                        }}>
                          {isStudent ? 'You' : msg.metadata?.authorName || 'Advisor'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostStudentReply} style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Send a message to your advisor..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={sendingReply}
                  style={{ flex: 1, fontSize: '0.825rem' }}
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyContent.trim()}
                  className="btn btn-primary"
                  style={{ gap: '6px', padding: '8px 14px' }}
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              Select an application on the left to view details and advisor messages.
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant */}
        <div className="card" style={{ padding: '16px', height: '560px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
              CampusFlow Copilot
            </span>
          </div>

          {/* AI History */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
            {aiChatHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.775rem',
                  lineHeight: 1.4,
                  backgroundColor: item.sender === 'ai' ? '#F8FAFC' : 'var(--accent-light)',
                  border: item.sender === 'ai' ? '1px solid #E2E8F0' : '1px solid var(--accent-border)',
                  color: 'var(--text-main)',
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: item.sender === 'ai' ? '#2563EB' : 'var(--text-dim)', marginBottom: '2px' }}>
                  {item.sender === 'ai' ? 'CampusFlow AI' : 'You'}
                </div>
                <div>{item.text}</div>
              </div>
            ))}
            {aiThinking && (
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Analyzing institutional pipelines...
              </div>
            )}
          </div>

          {/* AI Input Form */}
          <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="input"
              placeholder="Ask about your requests..."
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              disabled={aiThinking}
              style={{ flex: 1, fontSize: '0.78rem' }}
            />
            <button
              type="submit"
              disabled={aiThinking || !aiMessage.trim()}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 12px' }}
            >
              Ask
            </button>
          </form>
        </div>

      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: 0, marginBottom: '6px' }}>
              Submit New Application
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select an administrative pipeline and provide required details for processing.
            </p>

            {submitError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '14px' }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateApplication} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Target Pipeline
                </label>
                {pipelines.length === 0 ? (
                  <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8rem', color: '#64748B' }}>
                    No pipelines configured. Please ask your administrator to create a pipeline.
                  </div>
                ) : (
                  <select
                    className="select"
                    value={selectedPipelineId}
                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  >
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Application Title *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Admission Form - Academic Year 2026"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '0.825rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Description / Statement of Purpose
                </label>
                <textarea
                  className="input"
                  placeholder="Provide context or explanation..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', fontSize: '0.825rem', resize: 'vertical' }}
                />
              </div>

              {/* Dynamic Pipeline Custom Fields */}
              {pipelineFields.map((field) => {
                const isReq = field.isRequired || field.is_required;
                return (
                  <div key={field.id || field.name}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      {field.label} {isReq && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <input
                      type={field.fieldType === 'number' ? 'number' : 'text'}
                      className="input"
                      placeholder={`Enter ${field.label}...`}
                      value={fieldValues[field.name] || ''}
                      onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      required={Boolean(isReq)}
                      style={{ width: '100%', fontSize: '0.825rem' }}
                    />
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || pipelines.length === 0}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
