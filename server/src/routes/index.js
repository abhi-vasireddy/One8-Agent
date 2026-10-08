import { Router } from 'express';
import authRoutes from './auth.routes.js';
import requestsRoutes from './requests.routes.js';
import threadsRoutes from './threads.routes.js';
import notificationsRoutes from './notifications.routes.js';
import aiRoutes from './ai.routes.js';

// Config sub-routes
import branchesRoutes from './config/branches.routes.js';
import pipelinesRoutes from './config/pipelines.routes.js';
import stagesRoutes from './config/stages.routes.js';
import fieldsRoutes from './config/fields.routes.js';
import rolesRoutes from './config/roles.routes.js';
import permissionsRoutes from './config/permissions.routes.js';
import workflowsRoutes from './config/workflows.routes.js';
import formsRoutes from './config/forms.routes.js';
import collegeRoutes from './config/college.routes.js';
import auditRoutes from './config/audit.routes.js';
import slaRoutes from './config/sla.routes.js';

// Admin management routes
import adminUsersRoutes from './admin/users.routes.js';
import adminAccountRoutes from './admin/account.routes.js';
import departmentsRoutes from './config/departments.routes.js';

const router = Router();

// Core API routes
router.use('/auth', authRoutes);
router.use('/requests', requestsRoutes);
router.use('/threads', threadsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/ai', aiRoutes);

// Admin portal API routes
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/roles', rolesRoutes);
router.use('/admin/branches', branchesRoutes);
router.use('/admin/departments', departmentsRoutes);
router.use('/admin/account', adminAccountRoutes);

// Configuration routes
router.use('/config/branches', branchesRoutes);
router.use('/config/departments', departmentsRoutes);
router.use('/config/pipelines', pipelinesRoutes);
router.use('/config/stages', stagesRoutes);
router.use('/config/fields', fieldsRoutes);
router.use('/config/roles', rolesRoutes);
router.use('/config/permissions', permissionsRoutes);
router.use('/config/workflows', workflowsRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/config/forms', formsRoutes);
router.use('/config/college', collegeRoutes);
router.use('/config/audit-logs', auditRoutes);
router.use('/config/sla', slaRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CampusFlow AI Platform Engine',
  });
});

export default router;
