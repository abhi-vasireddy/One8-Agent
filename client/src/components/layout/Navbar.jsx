import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.js';
import { useConfigStore } from '../../stores/config-store.js';
import { 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  ChevronDown, 
  CheckCircle2,
  ExternalLink,
  LogOut
} from 'lucide-react';

export const Navbar = ({ onOpenAI }) => {
  const { user, portals, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pipelines, currentPipeline, setCurrentPipeline, notifications, unreadCount, markNotificationRead } = useConfigStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const currentRole = user?.roles?.[0]?.name || (user?.isSuperAdmin ? 'Super Admin' : 'User');
  const userPortals = portals || user?.access?.portals || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid var(--border-subtle)',
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Left: Pipeline Context Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {pipelines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.03em' }}>
              PIPELINE:
            </span>
            <select
              className="select"
              value={currentPipeline?.id || ''}
              onChange={(e) => {
                const found = pipelines.find(p => p.id === e.target.value);
                if (found) setCurrentPipeline(found);
              }}
              style={{
                width: 'auto',
                minWidth: '220px',
                padding: '5px 10px',
                fontSize: '0.785rem',
                backgroundColor: '#F8FAFC',
              }}
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Actions, Persona Switcher & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* AI Assistant Quick Trigger */}
        <button 
          onClick={onOpenAI}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px', color: 'var(--accent-primary)', borderColor: 'var(--accent-border)' }}
        >
          <Sparkles size={13} color="var(--accent-primary)" />
          <span>Ask AI Agent</span>
        </button>

        {/* User Profile & Account Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="btn btn-secondary btn-sm"
            style={{ gap: '8px', padding: '4px 10px', height: '34px' }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
              fontSize: '0.675rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {(user?.name || 'A')[0].toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem' }}>
              {user?.name ? user.name.split(' ')[0] : currentRole}
            </span>
            <span className="badge badge-gray" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
              {currentRole}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {showUserMenu && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                padding: '10px',
                zIndex: 50,
                background: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {/* Account Identity */}
              <div style={{ padding: '4px 6px 10px 6px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user?.name || 'Authorized User'}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                    {currentRole}
                  </span>
                </div>
              </div>

              {/* Permitted Workspace Links (Only if user has multiple accessible portals) */}
              {userPortals.length > 1 && (
                <div style={{ padding: '8px 4px 4px 4px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Switch Workspace
                  </div>
                  {userPortals.includes('admin_portal') && (
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.775rem',
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>Admin Portal</span>
                      <ExternalLink size={12} color="var(--text-muted)" />
                    </button>
                  )}
                  {userPortals.includes('management_agent') && (
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/board'); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.775rem',
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>Management Board</span>
                      <ExternalLink size={12} color="var(--text-muted)" />
                    </button>
                  )}
                  {userPortals.includes('student_agent') && (
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/agent'); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.775rem',
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>Student Agent</span>
                      <ExternalLink size={12} color="var(--text-muted)" />
                    </button>
                  )}
                </div>
              )}

              {/* Sign Out Button */}
              <div style={{ paddingTop: '6px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="btn btn-secondary btn-icon"
            style={{ position: 'relative' }}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-danger)',
              }} />
            )}
          </button>

          {showNotifMenu && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '300px',
                maxHeight: '360px',
                overflowY: 'auto',
                padding: '10px',
                zIndex: 50,
                background: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Notifications</span>
                <span className="badge badge-blue">{notifications.length}</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                  No recent notifications
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      background: n.isRead ? 'transparent' : '#F8FAFC',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      marginBottom: '2px',
                    }}
                  >
                    <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-main)' }}>{n.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.body}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
