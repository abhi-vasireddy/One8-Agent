import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.js';
import { Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export const LoginPage = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate(res.redirectPath || '/');
    } else {
      // Safe, generic security error (no account enumeration)
      setError(res.error?.includes('inactive') 
        ? 'Account is inactive. Please contact your administrator.' 
        : 'Invalid email or password.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      padding: '24px',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Background aesthetic touches */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '340px',
        background: 'linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 100%)',
        zIndex: 0,
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        border: '1px solid #E2E8F0',
        padding: '38px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '22px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
            marginBottom: '14px',
          }}>
            C
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            CampusFlow AI
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '6px', marginBottom: 0 }}>
            Institutional Portal & Administrative Workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            color: '#B91C1C',
            fontSize: '0.8rem',
            marginBottom: '18px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Institutional Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input"
                placeholder="name@campusflow.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  fontSize: '0.85rem',
                  height: '40px',
                  boxSizing: 'border-box',
                }}
              />
              <Mail size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94A3B8' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.74rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  fontSize: '0.85rem',
                  height: '40px',
                  boxSizing: 'border-box',
                }}
              />
              <Lock size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94A3B8' }} />
            </div>
          </div>

          {/* Remember Me Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: '#2563EB', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: '0.76rem', color: '#64748B', cursor: 'pointer', userSelect: 'none' }}>
              Remember this device
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '42px',
              fontSize: '0.875rem',
              fontWeight: 600,
              gap: '8px',
              justifyContent: 'center',
              marginTop: '6px',
            }}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Security Notice */}
        <div style={{
          marginTop: '28px',
          paddingTop: '18px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.725rem',
          color: '#94A3B8',
        }}>
          <Shield size={13} color="#94A3B8" />
          <span>Role-Based Access Control & End-to-End Encryption</span>
        </div>

        {/* Forgot Password Recovery Modal */}
        {showForgot && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: '8px' }}>
                Password Recovery
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
                To reset or change your institutional credentials, please contact your designated Campus Administrator or IT Services Department.
              </p>
              <button
                onClick={() => setShowForgot(false)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
