import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.js';
import { 
  LayoutDashboard, 
  Kanban, 
  Workflow, 
  FileText, 
  Bot, 
  Settings2,
  Building2,
  Sliders,
  ChevronRight,
  MessageSquare,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { user, portals, logout } = useAuthStore();
  const navigate = useNavigate();

  const currentRole = user?.roles?.[0]?.name || (user?.isSuperAdmin ? 'Super Admin' : 'User');
  const isSuperAdmin = Boolean(user?.isSuperAdmin || currentRole === 'Super Admin');
  const hasManagement = portals?.includes('management_agent') || isSuperAdmin;
  const isStudentOnly = !isSuperAdmin && !hasManagement;

  let navItems = [];

  if (isStudentOnly) {
    navItems = [
      { to: '/agent', label: 'My Applications', icon: Bot },
      { to: '/chat', label: 'Ask AI Copilot', icon: MessageSquare },
    ];
  } else {
    navItems = [
      { to: '/board', label: 'Pipeline Board', icon: Kanban },
      { to: '/threads', label: 'Threads Hub', icon: MessageSquare },
      { to: '/workflows', label: 'Custom Workflows', icon: Workflow },
      { to: '/forms', label: 'Form Builder', icon: FileText },
      { to: '/chat', label: 'AI Agent Assistant', icon: Bot },
    ];

    if (isSuperAdmin || portals?.includes('admin_portal')) {
      navItems.push({ to: '/admin', label: 'Admin Governance', icon: Settings2 });
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '230px',
      background: '#FFFFFF',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      gap: '4px',
      flexShrink: 0,
      zIndex: 20,
    }}>
      {/* Brand logo / header in sidebar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 10px 16px 10px',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '10px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '15px',
        }}>
          C
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            CampusFlow
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            {isStudentOnly ? 'Student Portal' : 'Enterprise Console'}
          </div>
        </div>
      </div>

      <div style={{
        padding: '4px 10px 8px 10px',
        fontSize: '0.675rem',
        fontWeight: 600,
        color: 'var(--text-dim)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {isStudentOnly ? 'Workspace' : 'Management'}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={16} color="currentColor" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & Sign Out */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-light)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          background: '#F8FAFC',
          marginBottom: '6px',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {currentRole}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>

        <div style={{
          padding: '4px 10px',
          fontSize: '0.65rem',
          color: 'var(--text-dim)',
          textAlign: 'center',
        }}>
          Apex Institute of Technology
        </div>
      </div>
    </aside>
  );
};
