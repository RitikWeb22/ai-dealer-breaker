import { Router } from 'express';
import { createNegotiation, getLeaderboard, startVapiSession } from '../controller/negotiation.controller.js'
const NegotiationRouter = Router();


NegotiationRouter.post('/negotiations', createNegotiation);

NegotiationRouter.get('/leaderboard', getLeaderboard);

NegotiationRouter.post('/start-session', startVapiSession);
export default NegotiationRouter;



