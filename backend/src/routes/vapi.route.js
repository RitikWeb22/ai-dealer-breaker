import { Router } from 'express';
import { getAssistantConfig, handleVapiWebhook, getLeaderboard } from '../controller/vapi.controller.js';

const vapiRouter = Router();

// 1. Session Config (Frontend start call ke liye)
vapiRouter.post('/session-config', getAssistantConfig);

// 2. Webhook (Vapi Dashboard mein ye URL dalega: /api/vapi/webhook)
vapiRouter.post('/webhook', handleVapiWebhook);

// 3. Leaderboard (Frontend fetch ke liye: /api/vapi/leaderboard)
vapiRouter.get('/leaderboard', getLeaderboard); // 👈 Ye missing tha!

export default vapiRouter;