import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/auth-store.js';
import { api } from '../../api/index.js';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Layers, 
  Search, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const ChatPage = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! I am CampusFlow AI. I am directly connected to your college's live configuration, pipelines, and permission policies. How can I assist you with admissions, grievance escalations, or tracking today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [aiContext, setAiContext] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    loadAiContext();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAiContext = async () => {
    try {
      const res = await api.ai.context();
      setAiContext(res?.data);
    } catch (e) {
      // Ignore
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.ai.chat(
        textToSend,
        messages.map(m => ({ sender: m.sender, content: m.text }))
      );

      const aiReply = res?.data?.reply || 'I received your inquiry and processed it through the platform engine.';

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiReply,
          timestamp: new Date(),
          contextUsed: res?.data?.contextUsed,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `I experienced an error connecting to the platform: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const samplePrompts = [
    'Check status for ADM-2026-001',
    'What pipelines and stages are currently configured?',
    'How do I file a student grievance ticket?',
    'What are the requirements for admission?',
  ];

  return (
    <div className="page-content" style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-blue">
              <Sparkles size={11} /> Agentic AI Assistant
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Metadata-Guided Operations</span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            CampusFlow Intelligent Assistant
          </h1>
        </div>

        {aiContext && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-gray">
              {aiContext.pipelines?.length || 2} Pipelines Loaded
            </span>
            <span className="badge badge-green">
              Role: {aiContext.user?.roles?.[0] || 'User'}
            </span>
          </div>
        )}
      </div>

      {/* Main Chat Box */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: '#FFFFFF',
        }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Bot size={16} color="var(--accent-primary)" />
                </div>
              )}

              <div style={{
                background: msg.sender === 'user' ? 'var(--accent-primary)' : '#F8FAFC',
                border: msg.sender === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-main)',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: '#F1F5F9',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <User size={15} color="var(--text-secondary)" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bot size={16} color="var(--accent-primary)" />
              </div>
              <div style={{
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                padding: '10px 14px',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}>
                Consulting college pipelines and resolving permissions...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Prompts */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          background: '#F8FAFC',
        }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="btn btn-secondary btn-sm"
              style={{ whiteSpace: 'nowrap', fontSize: '0.725rem', padding: '4px 8px' }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '10px',
            background: '#FFFFFF',
          }}
        >
          <input
            type="text"
            className="input"
            placeholder="Ask about admissions, tickets, stage movements, or university workflows..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSending || !input.trim()}
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
