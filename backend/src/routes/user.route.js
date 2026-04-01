import { Router } from 'express';
import { register, login, getProfile } from '../controller/user.controller.js';
import { identifyUser } from '../middleware/authMiddleware.js';
import { validateLogin, validateRequest, validateUser } from '../validator/validator.js';

const authRouter = Router();


authRouter.post('/register', validateUser, validateRequest, register);
authRouter.post('/login', validateLogin, validateRequest, login);
authRouter.get('/profile', identifyUser, getProfile);



export default authRouter;