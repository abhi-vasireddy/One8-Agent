import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.js';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export const PortalGuard = ({ portal, children }) => {
  const { user, portals, redirectPath } = useAuthStore();
  const navigate = useNavigate();

  const isAllowed = Boolean(
    user?.isSuperAdmin ||
    portals?.includes(portal) ||
    portals?.includes('admin_portal')
  );

  if (!isAllowed) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: '#FEF2F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: '#EF4444',
        }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
          Access Restricted
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '420px', lineHeight: 1.5, marginBottom: '24px' }}>
          You don't have permission to access this area. Your current role is configured for the self-service student or advisor portal.
        </p>
        <button
          onClick={() => navigate(redirectPath || '/agent')}
          className="btn btn-primary"
          style={{ gap: '8px', padding: '9px 18px', fontSize: '0.85rem' }}
        >
          <span>Go to My Workspace</span>
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return children;
};
