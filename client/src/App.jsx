import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store.js';
import { useConfigStore } from './stores/config-store.js';

import { Navbar } from './components/layout/Navbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { AIFloatingDrawer } from './components/ai/AIFloatingDrawer.jsx';

import { AuthGuard } from './components/auth/AuthGuard.jsx';
import { PortalGuard } from './components/auth/PortalGuard.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { StudentAgentPage } from './pages/student/StudentAgentPage.jsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';
import { PipelineBoardPage } from './pages/pipelines/PipelineBoardPage.jsx';
import { ThreadsPage } from './pages/threads/ThreadsPage.jsx';
import { WorkflowsListPage } from './pages/workflows/WorkflowsListPage.jsx';
import { WorkflowBuilderPage } from './pages/workflows/WorkflowBuilderPage.jsx';
import { FormsPage } from './pages/forms/FormsPage.jsx';
import { ChatPage } from './pages/chat/ChatPage.jsx';
import { AdminConfigPage } from './pages/admin/AdminConfigPage.jsx';

// Role-aware root redirect component
function RootRedirect() {
  const { user, portals, redirectPath } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin || user?.roles?.some(r => (r.name || r) === 'Super Admin');
  const hasManagement = portals?.includes('management_agent') || isSuperAdmin;
  const isStudentOnly = !isSuperAdmin && !hasManagement;

  if (isStudentOnly) {
    return <Navigate to="/agent" replace />;
  }
  return <DashboardPage />;
}

// Protected layout with sidebar & top navigation
function AppLayout() {
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="app-main">
        <Navbar onOpenAI={() => setIsAIDrawerOpen(true)} />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <AIFloatingDrawer
          isOpen={isAIDrawerOpen}
          onClose={() => setIsAIDrawerOpen(false)}
        />
      </div>
    </div>
  );
}

function App() {
  const { initAuth } = useAuthStore();
  const { fetchPipelines, fetchNotifications } = useConfigStore();

  useEffect(() => {
    initAuth();
    fetchPipelines();
    fetchNotifications();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<RootRedirect />} />
          
          {/* Student Dedicated Self-Service Portal */}
          <Route
            path="/agent"
            element={
              <PortalGuard portal="student_agent">
                <StudentAgentPage />
              </PortalGuard>
            }
          />

          {/* Management Agent Routes */}
          <Route
            path="/board"
            element={
              <PortalGuard portal="management_agent">
                <PipelineBoardPage />
              </PortalGuard>
            }
          />
          <Route
            path="/threads"
            element={
              <PortalGuard portal="management_agent">
                <ThreadsPage />
              </PortalGuard>
            }
          />
          <Route
            path="/workflows"
            element={
              <PortalGuard portal="management_agent">
                <WorkflowsListPage />
              </PortalGuard>
            }
          />
          <Route
            path="/workflows/:id"
            element={
              <PortalGuard portal="management_agent">
                <WorkflowBuilderPage />
              </PortalGuard>
            }
          />
          <Route
            path="/forms"
            element={
              <PortalGuard portal="management_agent">
                <FormsPage />
              </PortalGuard>
            }
          />

          {/* AI Copilot Chat (Accessible by all authenticated roles) */}
          <Route path="/chat" element={<ChatPage />} />

          {/* Super Admin Governance Portal */}
          <Route
            path="/admin"
            element={
              <PortalGuard portal="admin_portal">
                <AdminConfigPage />
              </PortalGuard>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
