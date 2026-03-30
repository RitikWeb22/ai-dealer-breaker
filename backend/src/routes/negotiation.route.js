import { Router } from 'express';
import { createNegotiation, startVapiSession } from '../controller/negotiation.controller.js'
const NegotiationRouter = Router();


NegotiationRouter.post('/negotiations', createNegotiation);

NegotiationRouter.post('/start-session', startVapiSession);

export default NegotiationRouter;



