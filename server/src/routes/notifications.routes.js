import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { NotificationEngine } from '../engines/notification-engine.js';
import * as response from '../utils/api-response.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const list = await NotificationEngine.getUserNotifications(req.user.id);
    return response.success(res, list || []);
  } catch (err) {
    return response.success(res, []);
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticate, async (req, res, next) => {
  try {
    const updated = await NotificationEngine.markAsRead(req.params.id, req.user.id);
    return response.success(res, updated, 'Notification marked as read');
  } catch (err) { next(err); }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await NotificationEngine.markAllAsRead(req.user.id);
    return response.success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
});

export default router;
