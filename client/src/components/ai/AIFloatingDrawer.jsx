import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/auth-store.js';
import { api } from '../../api/index.js';
import { Bot, Send, X, Sparkles } from 'lucide-react';

export const AIFloatingDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'ai',
      text: `Hello ${user?.name || 'Administrator'}! I am CampusFlow AI. Ask me about active pipelines, stage rules, student applications, or automate a task!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
    setIsSending(true);

    try {
      const res = await api.ai.chat(
        userText,
        messages.map(m => ({ sender: m.sender, content: m.text }))
      );

      const reply = res?.data?.reply || 'Operation handled by platform metadata engine.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '360px',
      height: '500px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '12px 16px',
          background: '#FFFFFF',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={14} color="var(--accent-primary)" />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>CampusFlow AI Assistant</span>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '3px' }}>
            <X size={14} />
          </button>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: '#FFFFFF',
        }}>
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.sender === 'user' ? 'var(--accent-primary)' : '#F8FAFC',
                border: m.sender === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                lineHeight: 1.45,
              }}
            >
              {m.text}
            </div>
          ))}
          {isSending && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.725rem', fontStyle: 'italic' }}>
              CampusFlow AI is evaluating live rules...
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{
          padding: '6px 12px',
          background: '#FFFFFF',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
        }}>
          {[
            'Summarize CSE applications',
            'How to move stages in CRM?',
            'What fields are configured?'
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => {
                setInput(promptText);
              }}
              style={{
                fontSize: '0.675rem',
                padding: '3px 8px',
                borderRadius: '12px',
                background: '#F1F5F9',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '10px 12px',
            background: '#F8FAFC',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '6px',
          }}
        >
          <input
            type="text"
            className="input"
            style={{ padding: '6px 10px', fontSize: '0.785rem' }}
            placeholder="Ask AI agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSending}>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
