import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CampusFlowAgent } from '../ai/agent.js';
import { ContextBuilder } from '../ai/context-builder.js';
import * as response from '../utils/api-response.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z.array(z.any()).optional().default([]),
});

// POST /api/ai/chat
router.post('/chat', authenticate, validate(chatSchema), async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;
    const result = await CampusFlowAgent.processMessage({
      user: req.user,
      collegeId: req.user.collegeId,
      message,
      conversationHistory,
    });

    return response.success(res, result);
  } catch (err) { next(err); }
});

// GET /api/ai/context — Inspect current metadata loaded for AI
router.get('/context', authenticate, async (req, res, next) => {
  try {
    const context = await ContextBuilder.buildContext(req.user.collegeId, req.user);
    return response.success(res, context);
  } catch (err) { next(err); }
});

export default router;
