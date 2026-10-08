import { apiClient } from './client.js';

export const api = {
  // Auth
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    me: () => apiClient.get('/auth/me'),
    demoSwitch: (roleName) => apiClient.post('/auth/demo-switch', { roleName }),
  },

  // Admin User & Account Management
  admin: {
    users: {
      list: (params) => apiClient.get('/admin/users', { params }),
      get: (id) => apiClient.get(`/admin/users/${id}`),
      create: (data) => apiClient.post('/admin/users', data),
      update: (id, data) => apiClient.put(`/admin/users/${id}`, data),
      changeRole: (id, data) => apiClient.patch(`/admin/users/${id}/role`, data),
      resetPassword: (id, data) => apiClient.post(`/admin/users/${id}/reset-password`, data),
      toggleStatus: (id, isActive) => apiClient.patch(`/admin/users/${id}/status`, { isActive }),
      assignRole: (id, roleId, branchId) => apiClient.post(`/admin/users/${id}/roles`, { roleId, branchId }),
      removeRole: (id, roleId) => apiClient.delete(`/admin/users/${id}/roles/${roleId}`),
    },
    account: {
      get: () => apiClient.get('/admin/account'),
      updateEmail: (email) => apiClient.put('/admin/account/email', { email }),
      updatePassword: (data) => apiClient.put('/admin/account/password', data),
    },
    branches: {
      list: () => apiClient.get('/admin/branches'),
    },
    departments: {
      list: () => apiClient.get('/admin/departments'),
    },
  },

  // Organization
  branches: {
    list: () => apiClient.get('/config/branches'),
  },
  departments: {
    list: () => apiClient.get('/config/departments'),
  },

  // Pipelines & Stages
  pipelines: {
    list: () => apiClient.get('/config/pipelines'),
    get: (id) => apiClient.get(`/config/pipelines/${id}`),
    create: (data) => apiClient.post('/config/pipelines', data),
    update: (id, data) => apiClient.put(`/config/pipelines/${id}`, data),
    archive: (id) => apiClient.delete(`/config/pipelines/${id}`),
    duplicate: (id) => apiClient.post(`/config/pipelines/${id}/duplicate`),
  },

  stages: {
    listForPipeline: (pipelineId) => apiClient.get(`/config/stages/pipelines/${pipelineId}/stages`),
    create: (pipelineId, data) => apiClient.post(`/config/stages/pipelines/${pipelineId}/stages`, data),
    update: (id, data) => apiClient.put(`/config/stages/${id}`, data),
    reorder: (pipelineId, stageOrders) => apiClient.put(`/config/stages/pipelines/${pipelineId}/stages/reorder`, { stageOrders }),
    delete: (id) => apiClient.delete(`/config/stages/${id}`),
    getTransitions: (pipelineId) => apiClient.get(`/config/stages/pipelines/${pipelineId}/transitions`),
    createTransition: (pipelineId, data) => apiClient.post(`/config/stages/pipelines/${pipelineId}/transitions`, data),
  },

  // Custom Fields
  fields: {
    list: () => apiClient.get('/config/fields'),
    create: (data) => apiClient.post('/config/fields', data),
    update: (id, data) => apiClient.put(`/config/fields/${id}`, data),
    delete: (id) => apiClient.delete(`/config/fields/${id}`),
    listSections: () => apiClient.get('/config/fields/sections'),
    createSection: (data) => apiClient.post('/config/fields/sections', data),
    deleteSection: (id) => apiClient.delete(`/config/fields/sections/${id}`),
    assignToPipeline: (data) => apiClient.post('/config/fields/assign-to-pipeline', data),
    removeFromPipeline: (pipelineFieldId) => apiClient.delete(`/config/fields/remove-from-pipeline/${pipelineFieldId}`),
  },

  // Roles & Permissions
  roles: {
    list: () => apiClient.get('/config/roles'),
    create: (data) => apiClient.post('/config/roles', data),
    update: (id, data) => apiClient.put(`/config/roles/${id}`, data),
    delete: (id) => apiClient.delete(`/config/roles/${id}`),
    assignUser: (data) => apiClient.post('/config/roles/assign-user', data),
  },

  permissions: {
    getForRole: (roleId) => apiClient.get(`/config/permissions/roles/${roleId}`),
    save: (data) => apiClient.post('/config/permissions', data),
    delete: (id) => apiClient.delete(`/config/permissions/${id}`),
  },

  // Workflows
  workflows: {
    list: () => apiClient.get('/config/workflows'),
    get: (id) => apiClient.get(`/config/workflows/${id}`),
    create: (data) => apiClient.post('/config/workflows', data),
    update: (id, data) => apiClient.put(`/config/workflows/${id}`, data),
    delete: (id) => apiClient.delete(`/config/workflows/${id}`),
    execute: (id, payload) => apiClient.post(`/config/workflows/${id}/execute`, payload),
    getExecutions: (id) => apiClient.get(`/config/workflows/${id}/executions`),
    getLogs: (executionId) => apiClient.get(`/config/workflows/executions/${executionId}/logs`),
  },

  // Forms
  forms: {
    list: () => apiClient.get('/config/forms'),
    get: (id) => apiClient.get(`/config/forms/${id}`),
    create: (data) => apiClient.post('/config/forms', data),
  },

  // Requests
  requests: {
    list: (params) => apiClient.get('/requests', { params }),
    get: (id) => apiClient.get(`/requests/${id}`),
    create: (data) => apiClient.post('/requests', data),
    transition: (id, data) => apiClient.post(`/requests/${id}/transition`, data),
    update: (id, data) => apiClient.put(`/requests/${id}`, data),
  },

  // Threads (CRM Collaborative Streams & Notes)
  threads: {
    list: (params) => apiClient.get('/threads', { params }),
    getThread: (requestId) => apiClient.get(`/threads/request/${requestId}`),
    postMessage: (requestId, data) => apiClient.post(`/threads/request/${requestId}/messages`, data),
    aiAssist: (requestId, data) => apiClient.post(`/threads/request/${requestId}/ai-assist`, data),
  },

  // Notifications
  notifications: {
    list: () => apiClient.get('/notifications'),
    markRead: (id) => apiClient.post(`/notifications/${id}/read`),
    markAllRead: () => apiClient.post('/notifications/read-all'),
  },

  // Audit Logs
  audit: {
    list: (params) => apiClient.get('/config/audit-logs', { params }),
  },

  // College & Campuses
  college: {
    get: () => apiClient.get('/config/college'),
    update: (data) => apiClient.put('/config/college', data),
    campuses: () => apiClient.get('/config/college/campuses'),
    departments: () => apiClient.get('/config/college/departments'),
  },

  // AI Agent
  ai: {
    chat: (message, conversationHistory) => apiClient.post('/ai/chat', { message, conversationHistory }),
    context: () => apiClient.get('/ai/context'),
  },
};
