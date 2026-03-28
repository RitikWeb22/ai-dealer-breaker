import { Router } from 'express';
import { register, login, getProfile } from '../controller/user.controller.js';
import { identifyUser } from '../middleware/authMiddleware.js';
import { validateLogin, validateUser } from '../validator/validator.js';

const authRouter = Router();


authRouter.post('/register', validateUser, register);
authRouter.post('/login', validateLogin, login);
authRouter.get('/profile', identifyUser, getProfile);



export default authRouter;