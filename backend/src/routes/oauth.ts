import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import * as oauthController from '../controllers/oauth.controller.js';

export const oauthRouter = Router();

oauthRouter.get('/callback', limit('oauth-callback', 30, 15 * 60_000), oauthController.googleCallback);
