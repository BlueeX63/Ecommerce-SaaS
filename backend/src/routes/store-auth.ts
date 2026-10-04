import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import * as storeAuthController from '../controllers/store-auth.controller.js';

export const storeAuthRouter = Router();

storeAuthRouter.post('/signup', limit('store-signup-ip', 10, 60 * 60_000), storeAuthController.signup);
storeAuthRouter.post('/login', limit('store-login-ip', 10, 5 * 60_000), storeAuthController.login);
storeAuthRouter.post('/logout', storeAuthController.logout);
