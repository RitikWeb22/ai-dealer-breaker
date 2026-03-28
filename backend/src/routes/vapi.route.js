import { Router } from 'express';
import { getAssistantConfig, handleVapiWebhook } from '../controller/vapi.controller.js';

const vapiRouter = Router();

// Route to get dynamic variables for the frontend vapi.start()
vapiRouter.post('/session-config', getAssistantConfig);

// Webhook URL (Must be added to Vapi Dashboard)
vapiRouter.post('/webhook', handleVapiWebhook);

export default vapiRouter;