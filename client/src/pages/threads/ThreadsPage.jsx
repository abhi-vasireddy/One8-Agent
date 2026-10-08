import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/index.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { useConfigStore } from '../../stores/config-store.js';
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  Sparkles,
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  User,
  ChevronRight,
  ArrowRight,
  Tag,
  RefreshCw,
  SlidersHorizontal,
  FileText
} from 'lucide-react';

export const ThreadsPage = () => {
  const { user } = useAuthStore();
  const { pipelines } = useConfigStore();

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadDetail, setThreadDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPipeline, setFilterPipeline] = useState('all');

  // Composer State
  const [messageText, setMessageText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // AI Assist State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadThreads();
  }, [filterPipeline]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadDetail?.timeline]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPipeline !== 'all') params.pipelineId = filterPipeline;
      const res = await api.threads.list(params);
      const list = res?.data || [];
      setThreads(list);

      // Auto-select first thread if none is selected
      if (list.length > 0 && !selectedThread) {
        selectThread(list[0]);
      } else if (selectedThread) {
        // Keep selected thread refreshed
        const found = list.find(t => t.requestId === selectedThread.requestId);
        if (found) selectThread(found);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectThread = async (threadItem) => {
    setSelectedThread(threadItem);
    setLoadingDetail(true);
    setAiSummary(null);
    try {
      const res = await api.threads.getThread(threadItem.requestId);
      setThreadDetail(res?.data);
    } catch (err) {
      console.error('Failed to load thread detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedThread || isSending) return;

    setIsSending(true);
    try {
      await api.threads.postMessage(selectedThread.requestId, {
        content: messageText.trim(),
        isInternal,
      });

      setMessageText('');
      // Reload this thread's details & list
      const res = await api.threads.getThread(selectedThread.requestId);
      setThreadDetail(res?.data);

      // Refresh threads inbox preview
      const listRes = await api.threads.list(filterPipeline !== 'all' ? { pipelineId: filterPipeline } : {});
      setThreads(listRes?.data || []);
    } catch (err) {
      alert(`Could not send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleStageChange = async (targetStageId) => {
    if (!selectedThread || !targetStageId) return;
    try {
      await api.requests.transition(selectedThread.requestId, {
        targetStageId,
        reason: `Stage changed via Threads Hub by ${user?.name || 'Advisor'}`,
      });
      // Refresh
      const res = await api.threads.getThread(selectedThread.requestId);
      setThreadDetail(res?.data);
      loadThreads();
    } catch (err) {
      alert(`Stage transition failed: ${err.message}`);
    }
  };

  const handleAIAssist = async (action) => {
    if (!selectedThread || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await api.threads.aiAssist(selectedThread.requestId, { action });
      const suggestion = res?.data?.suggestion;

      if (action === 'summarize') {
        setAiSummary(suggestion);
      } else if (action === 'draft_reply') {
        setIsInternal(false);
        setMessageText(suggestion);
      }
    } catch (err) {
      alert(`AI assistance error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter threads by search query
  const filteredThreads = threads.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.requestNumber?.toLowerCase().includes(q) ||
      t.lastMessage?.content?.toLowerCase().includes(q) ||
      t.pipelineName?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#F8FAFC' }}>
      {/* ──────────────── Left Column: Threads Inbox ──────────────── */}
      <div style={{
        width: '360px',
        borderRight: '1px solid var(--border-subtle)',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Header & Controls */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageSquare size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Threads Hub
              </h2>
            </div>
            <button
              onClick={loadThreads}
              className="btn btn-secondary btn-icon"
              title="Refresh Threads"
              style={{ padding: '6px', border: 'none' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search conversations, applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
            />
          </div>

          {/* Pipeline Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={12} style={{ color: 'var(--text-dim)' }} />
            <select
              value={filterPipeline}
              onChange={(e) => setFilterPipeline(e.target.value)}
              className="select"
              style={{ fontSize: '0.75rem', padding: '4px 8px', height: '30px' }}
            >
              <option value="all">All Pipelines</option>
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Threads List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && threads.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading active threads...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💬</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>No conversations found</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Create an application on the Pipeline Board to begin a live discussion thread!
              </p>
            </div>
          ) : (
            filteredThreads.map(t => {
              const isSelected = selectedThread?.requestId === t.requestId;
              return (
                <div
                  key={t.requestId}
                  onClick={() => selectThread(t)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.05)' : '#FFFFFF',
                    borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                      {t.requestNumber}
                    </span>
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-secondary)' }}>
                      {t.pipelineName}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '8px' }}>
                    {t.lastMessage ? (
                      <span>
                        {t.lastMessage.isInternal ? <strong style={{ color: '#D97706' }}>[Note] </strong> : null}
                        {t.lastMessage.content}
                      </span>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>No messages yet</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: t.stageColor || 'var(--accent-primary)',
                        display: 'inline-block',
                      }} />
                      <span>{t.stageName}</span>
                    </div>
                    {t.messageCount > 0 && (
                      <span style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                        {t.messageCount} msgs
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ──────────────── Right Column: Active Conversation Thread ──────────────── */}
      {selectedThread ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', overflow: 'hidden' }}>
          {/* Thread Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-blue" style={{ fontFamily: 'var(--font-mono)' }}>
                  {selectedThread.requestNumber}
                </span>
                <span className="badge badge-purple">
                  {selectedThread.pipelineName}
                </span>
                <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#B45309' }}>
                  {selectedThread.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {selectedThread.title}
              </h1>
            </div>

            {/* Quick Actions & Stage Transition */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleAIAssist('summarize')}
                disabled={aiLoading}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', gap: '6px', display: 'flex', alignItems: 'center', background: 'rgba(124, 58, 237, 0.05)', color: '#7C3AED', borderColor: 'rgba(124, 58, 237, 0.2)' }}
              >
                <Sparkles size={13} />
                <span>AI Summary</span>
              </button>

              <button
                onClick={() => handleAIAssist('draft_reply')}
                disabled={aiLoading}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', gap: '6px', display: 'flex', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)', color: 'var(--accent-primary)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
              >
                <Sparkles size={13} />
                <span>Draft Reply</span>
              </button>

              {/* Stage Transition Selector */}
              {threadDetail?.request?.stage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px', borderLeft: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stage:</span>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857', fontWeight: 600 }}>
                    {threadDetail.request.stageName || threadDetail.request.stage.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary Banner (if triggered) */}
          {aiSummary && (
            <div style={{
              margin: '16px 24px 0 24px',
              padding: '14px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.8) 0%, rgba(238, 242, 255, 0.8) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8rem', color: '#6D28D9' }}>
                  <Sparkles size={14} />
                  <span>CampusFlow Friendly AI Insights</span>
                </div>
                <button
                  onClick={() => setAiSummary(null)}
                  style={{ background: 'none', border: 'none', color: '#6D28D9', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4C1D95', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {aiSummary}
              </div>
            </div>
          )}

          {/* Custom Fields Highlights Bar */}
          {selectedThread.customFieldValues && Object.keys(selectedThread.customFieldValues).length > 0 && (
            <div style={{
              padding: '10px 24px',
              background: '#F8FAFC',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              overflowX: 'auto',
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', flexShrink: 0 }}>
                Attributes:
              </span>
              {Object.entries(selectedThread.customFieldValues).map(([k, v]) => (
                <div key={k} style={{
                  background: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.725rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{String(v)}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Message Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Loading thread conversation...
              </div>
            ) : !threadDetail?.timeline || threadDetail.timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Start the conversation</div>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Post an internal advisor note or send a warm update to the applicant below.
                </p>
              </div>
            ) : (
              threadDetail.timeline.map((item) => {
                if (item.type === 'status_transition') {
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#F1F5F9',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.725rem',
                        color: 'var(--text-secondary)',
                      }}>
                        <ArrowRight size={12} color="var(--accent-primary)" />
                        <span><strong>{item.authorName}</strong> {item.reason}</span>
                        <span style={{ color: 'var(--text-dim)' }}>• {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                }

                const isInternalNote = item.isInternal;
                const isSystem = item.senderType === 'system';

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: isInternalNote ? 'stretch' : 'flex-start',
                      maxWidth: isInternalNote ? '100%' : '85%',
                    }}
                  >
                    {/* Message Bubble Card */}
                    <div style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      background: isInternalNote
                        ? '#FFFBEB'
                        : isSystem
                        ? '#F8FAFC'
                        : '#FFFFFF',
                      border: isInternalNote
                        ? '1px solid #FDE68A'
                        : '1px solid var(--border-subtle)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isInternalNote ? '#F59E0B' : 'var(--accent-primary)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.675rem',
                          }}>
                            {item.authorName?.charAt(0) || 'U'}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {item.authorName}
                          </span>

                          {isInternalNote && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#FEF3C7',
                              color: '#B45309',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              <Lock size={10} />
                              Internal Staff Note
                            </span>
                          )}

                          {!isInternalNote && !isSystem && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--accent-primary)',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              <Globe size={10} />
                              Applicant Visible
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {item.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer Box */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: isInternal ? '#FFFDF5' : '#FFFFFF',
            transition: 'background 0.2s ease',
          }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setIsInternal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: !isInternal ? 'var(--accent-primary)' : '#E2E8F0',
                  color: !isInternal ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Globe size={12} />
                <span>Public Reply</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInternal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isInternal ? '#F59E0B' : '#E2E8F0',
                  color: isInternal ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Lock size={12} />
                <span>Internal Staff Note</span>
              </button>

              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {isInternal ? '🔒 Only colleagues can see this note' : '🌐 Message will be shared with the applicant'}
              </span>
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isInternal ? 'Write an internal note for advisors...' : 'Write a friendly response to the applicant...'}
                className="input"
                style={{
                  flex: 1,
                  minHeight: '64px',
                  maxHeight: '140px',
                  resize: 'none',
                  fontSize: '0.85rem',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  borderColor: isInternal ? '#FCD34D' : 'var(--border-subtle)',
                }}
              />

              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="btn btn-primary"
                style={{
                  height: '44px',
                  padding: '0 20px',
                  background: isInternal ? '#F59E0B' : 'var(--accent-primary)',
                  borderColor: isInternal ? '#F59E0B' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Welcome to Threads Hub</h2>
          <p style={{ fontSize: '0.85rem', maxWidth: '420px', textAlign: 'center', marginTop: '6px' }}>
            Select any student application or inquiry on the left to review collaborative notes, reply to questions, and track live status.
          </p>
        </div>
      )}
    </div>
  );
};
export default ThreadsPage;
